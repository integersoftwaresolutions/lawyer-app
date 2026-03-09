import { ApiError } from "../helpers/apiError.js";
import LawyerProfile from "../models/LawyerProfile.js";
import VerificationDocument from "../models/VerificationDocument.js";
import User from "../models/User.js";
import { VERIFICATION_STATUS, DOCUMENT_TYPES } from "../config/constants.js";
import { mediaService } from "./media.service.js";

/**
 * Professional Verification Service
 * Handles all lawyer verification operations
 */

/**
 * Get verification status for a lawyer
 */
export async function getVerificationStatus(lawyerUserId) {
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId })
    .populate("userId", "email createdAt")
    .lean();
  
  if (!profile) {
    throw new ApiError(404, "Lawyer profile not found");
  }

  const documents = await VerificationDocument.find({ lawyerUserId })
    .populate("mediaId")
    .sort({ createdAt: -1 })
    .lean();

  // Group documents by type
  const documentsByType = {};
  documents.forEach(doc => {
    if (!documentsByType[doc.documentType]) {
      documentsByType[doc.documentType] = [];
    }
    documentsByType[doc.documentType].push(doc);
  });

  return {
    profile: {
      verificationStatus: profile.verificationStatus,
      verificationNotes: profile.verificationNotes,
      verifiedAt: profile.verifiedAt,
      fullName: profile.fullName,
      email: profile.userId?.email,
      barCouncilNumber: profile.barCouncilNumber,
      barCouncil: profile.barCouncil,
      cnic: profile.cnic
    },
    documents: documentsByType,
    allDocuments: documents,
    requiredDocuments: [
      { type: DOCUMENT_TYPES.BAR_LICENSE, label: "Bar License", required: true },
      { type: DOCUMENT_TYPES.GOVERNMENT_ID, label: "Government ID (CNIC)", required: true },
      { type: DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE, label: "Professional Certificate", required: false }
    ]
  };
}

/**
 * Upload verification document
 * 
 * @param {Object} params - Parameters
 * @param {Object} params.file - Multer file object (req.file) - REQUIRED
 * @param {string} params.lawyerUserId - Lawyer user ID
 * @param {string} params.documentType - Type of document
 * @returns {Promise<Object>} Verification document
 */
export async function uploadVerificationDocument({ file, lawyerUserId, documentType }) {
  // Validate document type
  if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
    throw new ApiError(400, "Invalid document type");
  }

  // Check if lawyer profile exists
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId });
  if (!profile) {
    throw new ApiError(404, "Lawyer profile not found");
  }

  // Validate file
  if (!file) {
    throw new ApiError(400, "No file provided");
  }

  // Upload file using MediaService
  const media = await mediaService.upload(file, {
    mediaType: "VERIFICATION_DOCUMENT",
    uploadedBy: lawyerUserId,
    relatedEntityType: "VerificationDocument",
    validation: {
      maxSize: 5 * 1024 * 1024, // 5MB for documents
      allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"]
    },
    folder: "verification-documents"
  });

  // Find and mark old documents of same type as replaced
  const oldDocuments = await VerificationDocument.find({
    lawyerUserId,
    documentType,
    status: "PENDING"
  });

  // Delete old media files
  for (const oldDoc of oldDocuments) {
    if (oldDoc.mediaId) {
      try {
        await mediaService.delete(oldDoc.mediaId, { hardDelete: true });
      } catch (error) {
        console.error(`Failed to delete old media ${oldDoc.mediaId}:`, error);
      }
    }
  }

  // Mark old documents as replaced
  await VerificationDocument.updateMany(
    { lawyerUserId, documentType, status: "PENDING" },
    { status: "REJECTED", adminNotes: "Replaced by new upload" }
  );

  // Create new verification document with Media reference
  const document = await VerificationDocument.create({
    lawyerUserId,
    documentType,
    mediaId: media._id,
    status: VERIFICATION_STATUS.PENDING
  });

  // Reset verification status to PENDING if it was REJECTED
  if (profile.verificationStatus === VERIFICATION_STATUS.REJECTED) {
    profile.verificationStatus = VERIFICATION_STATUS.PENDING;
    profile.verificationNotes = "";
    await profile.save();
  }

  // Populate media for response
  await document.populate("mediaId");
  return document.toObject();
}

/**
 * Get all documents for a lawyer (for admin review)
 */
export async function getLawyerDocuments(lawyerUserId) {
  const documents = await VerificationDocument.find({ lawyerUserId })
    .populate("reviewedBy", "email")
    .populate("mediaId")
    .sort({ createdAt: -1 })
    .lean();

  return documents;
}

/**
 * Review a verification document (admin only)
 */
export async function reviewDocument({ documentId, status, notes, adminId }) {
  const document = await VerificationDocument.findById(documentId);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  document.status = status;
  document.adminNotes = notes || "";
  document.reviewedAt = new Date();
  document.reviewedBy = adminId;

  await document.save();

  // Check if all required documents are approved
  await checkAndUpdateVerificationStatus(document.lawyerUserId);

  return document.toObject();
}

/**
 * Verify lawyer (approve/reject) - Admin action
 */
export async function verifyLawyer({ lawyerUserId, status, notes, adminId }) {
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId });
  if (!profile) {
    throw new ApiError(404, "Lawyer profile not found");
  }

  // Validate status
  if (!Object.values(VERIFICATION_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid verification status");
  }

  profile.verificationStatus = status;
  profile.verificationNotes = notes || "";

  if (status === VERIFICATION_STATUS.APPROVED) {
    profile.verifiedAt = new Date();
  } else if (status === VERIFICATION_STATUS.REJECTED) {
    profile.verifiedAt = null;
  }

  await profile.save();

  return profile.toObject();
}

/**
 * Check if all required documents are approved and update verification status
 */
async function checkAndUpdateVerificationStatus(lawyerUserId) {
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId });
  if (!profile) return;

  // Get all required documents
  const requiredDocs = await VerificationDocument.find({
    lawyerUserId,
    documentType: { $in: [DOCUMENT_TYPES.BAR_LICENSE, DOCUMENT_TYPES.GOVERNMENT_ID] }
  }).lean();

  // Check if all required documents are approved
  const allApproved = requiredDocs.length >= 2 && 
    requiredDocs.every(doc => doc.status === VERIFICATION_STATUS.APPROVED);

  // Auto-approve if all required documents are approved and status is PENDING
  if (allApproved && profile.verificationStatus === VERIFICATION_STATUS.PENDING) {
    // Don't auto-approve - let admin review manually
    // profile.verificationStatus = VERIFICATION_STATUS.APPROVED;
    // profile.verifiedAt = new Date();
    // await profile.save();
  }
}

/**
 * Get pending verifications for admin
 */
export async function getPendingVerifications({ page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  const [lawyers, total] = await Promise.all([
    LawyerProfile.find({ verificationStatus: VERIFICATION_STATUS.PENDING })
      .populate("userId", "email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LawyerProfile.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING })
  ]);

  // Get documents for each lawyer
  const lawyersWithDocs = await Promise.all(
    lawyers.map(async (lawyer) => {
      const documents = await VerificationDocument.find({ 
        lawyerUserId: lawyer.userId._id || lawyer.userId 
      })
        .populate("mediaId")
        .sort({ createdAt: -1 })
        .lean();
      
      return {
        ...lawyer,
        documents,
        documentCount: documents.length,
        approvedDocuments: documents.filter(d => d.status === VERIFICATION_STATUS.APPROVED).length
      };
    })
  );

  return {
    items: lawyersWithDocs,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

/**
 * Check if lawyer is verified
 */
export async function isLawyerVerified(lawyerUserId) {
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId }).lean();
  return profile?.verificationStatus === VERIFICATION_STATUS.APPROVED;
}

