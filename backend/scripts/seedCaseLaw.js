/**
 * Seed the case-law corpus with synthetic demo judgments.
 *
 * These are NOT real judgments — they are clearly marked DEMO TEST FIXTURES
 * intended only for exercising the RAG pipeline (chunking, embedding,
 * Pinecone upsert, retrieval, citation rendering). The legal principles
 * referenced are accurate so the AI assistant can produce meaningful
 * responses to the quick-prompt chips on the lawyer dashboard.
 *
 * Run with:
 *   cd backend
 *   node scripts/seedCaseLaw.js
 *
 * Flags:
 *   --reset       Delete every demo row before re-ingesting (idempotent
 *                 by default; only use --reset if you want a clean wipe).
 *
 * Safe to re-run: ingestion is idempotent — it keys on title+court+year so
 * each judgment is upserted in place rather than duplicated.
 */

import mongoose from "mongoose";
import { connectMongo } from "../src/db/mongo.js";
import { isOpenAiConfigured } from "../src/services/ai/openai.client.js";
import { isPineconeConfigured, ragConfig } from "../src/config/rag.config.js";
import * as ingestService from "../src/services/ai/ingest/ingest.service.js";
import CaseLaw from "../src/models/CaseLaw.js";

const SEEDS = [
  {
    title: "Muhammad Akram v. The State",
    citation: "DEMO 2024 SC 101",
    court: "Supreme Court of Pakistan",
    year: 2024,
    caseReference: "Crl. Appeal 123/2024",
    subject: "Criminal Law",
    judges: ["Justice Aisha A. Malik", "Justice Syed Mansoor Ali Shah"],
    decisionDate: new Date("2024-03-15"),
    sourceUrl: "https://www.supremecourt.gov.pk/downloads_judgements/demo_2024_sc_101.pdf",
    sourceProvider: "Supreme Court of Pakistan (Demo)",
    text: `[DEMO TEST FIXTURE — synthetic judgment for RAG testing only]

JUDGMENT
Aisha A. Malik, J.- This criminal appeal arises out of an order of the High Court refusing post-arrest bail to the appellant, Muhammad Akram, under Section 497 of the Code of Criminal Procedure, 1898 ("Cr.P.C.") in connection with FIR No. 412/2023 registered under Section 302 of the Pakistan Penal Code, 1860.

2. The principal question before us is whether the case of the appellant falls within the exception clauses of Section 497(1) Cr.P.C., or alternatively, whether his continued detention is justified having regard to the principle of "further inquiry" under Section 497(2) Cr.P.C.

3. It is by now well settled that grant of bail in non-bailable offences is governed by the following established principles:

(a) The basic rule under Section 497(1) is that bail in a non-bailable offence ordinarily ought not to be refused if there are no reasonable grounds for believing that the accused has been guilty of an offence punishable with death, imprisonment for life, or imprisonment for ten years.

(b) Where the punishment prescribed exceeds ten years, bail is the exception and refusal the rule. The Court must satisfy itself, on a tentative assessment of the material before it, that there exist reasonable grounds for believing that the accused committed the offence.

(c) The first proviso to Section 497(1) — commonly referred to as the "statutory concessions" — confers a relaxed bail standard upon (i) persons under the age of sixteen years, (ii) women, and (iii) persons who are sick or infirm. In their case, the Court may grant bail unless special circumstances exist that bar release.

(d) The second proviso — the "further inquiry" rule — applies where the case against the accused does not fall in the prohibitory clause but the matter requires further investigation. Where two views are reasonably possible on the available material, bail must follow as of right.

(e) The pendency of trial, hardship caused by prolonged incarceration without conclusion, and statutory rights to expeditious disposal under Article 10A of the Constitution of 1973 are relevant considerations. Following Tariq Bashir v. The State (PLD 1995 SC 34) and the consistent line of authority since, mere gravity of the charge cannot, by itself, justify continued detention if statutory delay benchmarks are exceeded.

4. Applying these principles to the present record: the appellant has been in custody for fourteen months, the challan has been submitted, and the prosecution case rests primarily upon a single eyewitness whose statement under Section 161 Cr.P.C. is materially inconsistent with the contents of the FIR. The medico-legal report does not corroborate the manner of injury alleged by the prosecution. These features bring the case within the ambit of "further inquiry."

5. We accordingly allow the appeal, set aside the impugned order, and admit the appellant to bail subject to his furnishing two solvent sureties in the sum of Rs. 500,000 each to the satisfaction of the trial court. Nothing in this order shall be construed as an expression on the merits of the case.

Appeal allowed.`
  },
  {
    title: "Federation of Pakistan v. M/s Premier Plastics (Pvt.) Ltd.",
    citation: "DEMO 2023 SC 88",
    court: "Supreme Court of Pakistan",
    year: 2023,
    caseReference: "Civil Appeal 456/2022",
    subject: "Constitutional Law",
    judges: ["Justice Munib Akhtar", "Justice Yahya Afridi", "Justice Athar Minallah"],
    decisionDate: new Date("2023-11-20"),
    sourceUrl: "https://www.supremecourt.gov.pk/downloads_judgements/demo_2023_sc_88.pdf",
    sourceProvider: "Supreme Court of Pakistan (Demo)",
    text: `[DEMO TEST FIXTURE — synthetic judgment for RAG testing only]

JUDGMENT
Munib Akhtar, J.- The question for determination in this civil appeal is whether the cancellation of the respondent's import quota by the Federal Board of Revenue, made without affording the respondent any opportunity of cross-examining the inspecting officers whose report formed the sole basis of the adverse decision, is sustainable in light of the guarantee of "fair trial and due process" under Article 10A of the Constitution of the Islamic Republic of Pakistan, 1973.

2. Article 10A, inserted by the Constitution (Eighteenth Amendment) Act, 2010, ordains that "for the determination of his civil rights and obligations or in any criminal charge against him a person shall be entitled to a fair trial and due process." The Article codifies, as an enforceable fundamental right, the twin pillars of natural justice: (i) audi alteram partem — that no one shall be condemned unheard — and (ii) nemo judex in causa sua — that no one shall be a judge in his own cause.

3. We have repeatedly held that the right to a fair trial encompasses, at minimum, the following components: (a) adequate notice of the case to be met, (b) disclosure of the materials relied upon by the adjudicating authority, (c) a meaningful opportunity to lead evidence in defence, (d) the right to confront and cross-examine adverse witnesses, and (e) a reasoned decision by an impartial forum. The denial of any of these components, in a matter affecting civil rights, is sufficient to vitiate the decision.

4. The right of cross-examination is not a procedural luxury. As recognised in Articles 132 to 139 of the Qanun-e-Shahadat Order, 1984, cross-examination is the "engine of truth" — it is the principal device by which the credibility of testimony is tested, contradictions are exposed, and the fact-finder is enabled to make a just determination. When an administrative action is founded upon the testimony of identifiable witnesses, the rules of natural justice and Article 10A converge to require that the affected party be given an opportunity to cross-examine those witnesses, unless cogent reasons of confidentiality or public interest, recorded in writing, justify a departure.

5. The reasoning in New Jubilee Insurance v. NBP (PLD 1999 SC 1126) and Mehram Ali v. Federation of Pakistan (PLD 1998 SC 1445) is reaffirmed: an order entailing civil consequences passed without observance of audi alteram partem is a nullity, even if the underlying statute is silent on procedure.

6. In the present case the inspecting officers' report was the only material adverse to the respondent. The respondent's repeated written requests for an opportunity to cross-examine those officers were rejected without reasons. The cancellation order is therefore set aside as violative of Article 10A. The matter is remitted to the Federal Board of Revenue with a direction to redo the proceedings after affording a full opportunity of cross-examination, within ninety days.

Appeal dismissed.`
  },
  {
    title: "The State v. Yasir Mehmood",
    citation: "DEMO 2024 LHC 47",
    court: "Lahore High Court",
    year: 2024,
    caseReference: "Crl. Appeal 89/2023",
    subject: "Criminal Law",
    judges: ["Justice Muhammad Tariq Saleem Sheikh"],
    decisionDate: new Date("2024-05-10"),
    sourceUrl: "https://sys.lhc.gov.pk/appjudgments/demo_2024_lhc_47.pdf",
    sourceProvider: "Lahore High Court (Demo)",
    text: `[DEMO TEST FIXTURE — synthetic judgment for RAG testing only]

JUDGMENT
Muhammad Tariq Saleem Sheikh, J.- The appellant Yasir Mehmood challenges his conviction under Section 392 of the Pakistan Penal Code, 1860 ("PPC"). The conviction rests almost entirely upon CCTV footage recovered from a private commercial premises and call-detail records ("CDRs") obtained from a cellular service provider. The principal question is whether this electronic evidence was properly admitted under the Qanun-e-Shahadat Order, 1984 ("QSO").

2. Articles 164 and 165 of the QSO, read with the Electronic Transactions Ordinance, 2002, govern the admissibility of evidence in electronic form. Article 164 expressly permits the Court to allow any evidence that may have become available because of modern devices and techniques, while Article 165 requires the Court to ascertain the genuineness, authenticity, accuracy, and integrity of such evidence.

3. The settled requirements for admission of electronic evidence in criminal proceedings, as recognised in Ishtiaq Ahmed Mirza v. Federation of Pakistan (PLD 2019 SC 675) and the consistent line of subsequent authority, are: (a) chain of custody must be unbroken from the moment of seizure to production in court; (b) the producing officer must testify to the device or system used to record/extract the data; (c) where the evidence is generated by a computer system, a certificate identifying the device, the manner of production, and confirming its proper functioning is essential; (d) the original storage medium, or a forensic image thereof verified by hash value (typically MD5/SHA-256), must be preserved and produced; and (e) the prosecution must demonstrate that the contents have not been edited, manipulated, or otherwise altered.

4. In the present case, the CCTV footage was extracted on a USB drive by the investigating officer without obtaining a forensic image, without recording the hash value of the original storage, and without preserving the digital video recorder ("DVR") for production at trial. The producing officer admitted in cross-examination that he was not trained in digital forensics and that the footage was "edited for relevance" before being submitted with the challan. These admissions strike at the integrity of the evidence and render it unfit for use against the accused.

5. So far as the CDRs are concerned, the prosecution failed to produce any officer of the cellular service provider; the printout was tendered through the investigating officer alone. In the absence of testimony from the issuing custodian under Article 78 read with Article 164 QSO, the CDRs do not satisfy the test of authenticity.

6. The remaining evidence — the testimony of two prosecution witnesses — is materially inconsistent on the description of the assailant and the time of the occurrence. The case is therefore one of doubt, the benefit of which must accrue to the accused.

7. The appeal is allowed. The conviction and sentence recorded by the trial court are set aside and the appellant is acquitted of the charge. He shall be released forthwith if not required in any other case.

Appeal allowed.`
  },
  {
    title: "Saima Bibi v. Additional District Judge, Lahore",
    citation: "DEMO 2024 LHC 12",
    court: "Lahore High Court",
    year: 2024,
    caseReference: "W.P. 9087/2023",
    subject: "Family Law",
    judges: ["Justice Sadaqat Ali Khan"],
    decisionDate: new Date("2024-01-22"),
    sourceUrl: "https://sys.lhc.gov.pk/appjudgments/demo_2024_lhc_12.pdf",
    sourceProvider: "Lahore High Court (Demo)",
    text: `[DEMO TEST FIXTURE — synthetic judgment for RAG testing only]

JUDGMENT
Sadaqat Ali Khan, J.- This constitutional petition under Article 199 of the Constitution challenges concurrent findings of the Family Court and the Additional District Judge whereby the petitioner's suit for recovery of dower and maintenance was partially decreed.

2. The principal contention raised before this Court is that the courts below failed to appreciate the evidentiary value of the nikahnama in determining the prompt portion of the dower (mehr-e-mua'jjal) and that maintenance for the iddat period was wrongly denied.

3. It is settled law under the Muslim Family Laws Ordinance, 1961 ("MFLO") and the West Pakistan Family Courts Act, 1964 that the entries in a duly registered nikahnama enjoy a presumption of correctness. A wife is entitled to recover the prompt portion of the dower at any time during the subsistence of the marriage; the deferred portion (mehr-e-muwajjal) becomes due upon dissolution of marriage by death or divorce.

4. As to maintenance, the obligation flowing from Section 9 of the MFLO and the principles of Islamic jurisprudence applicable to a Muslim husband encompasses (i) past maintenance for the period the wife was lawfully entitled to it but not paid, (ii) maintenance during the period of iddat following talaq, and (iii) where applicable, maintenance for minor children in the petitioner's custody.

5. The Family Court correctly decreed the prompt dower of Rs. 500,000 in favour of the petitioner. However, the denial of iddat maintenance solely on the basis that the petitioner had returned to her parental home is unsustainable. As held in Mst. Kaneez Fatima v. Wali Muhammad (PLD 1993 SC 901), the conduct of returning to the parental home after talaq is not a bar to iddat maintenance unless coupled with proof of nashooz (disobedience without reasonable cause).

6. Accordingly, the impugned judgments are modified. The petitioner shall be entitled to (a) the decreed prompt dower of Rs. 500,000, (b) iddat maintenance at Rs. 25,000 per month for three lunar months, and (c) maintenance for the minor children at Rs. 30,000 per month each, payable from the date of talaq until the children attain majority or, in the case of the daughter, until her marriage. The petition is partly allowed in these terms.

Petition partly allowed.`
  },
  {
    title: "M/s Arif Constructors v. National Highway Authority",
    citation: "DEMO 2023 SC 142",
    court: "Supreme Court of Pakistan",
    year: 2023,
    caseReference: "Civil Appeal 901/2022",
    subject: "Contract Law",
    judges: ["Justice Qazi Faez Isa", "Justice Ijaz ul Ahsan"],
    decisionDate: new Date("2023-08-04"),
    sourceUrl: "https://www.supremecourt.gov.pk/downloads_judgements/demo_2023_sc_142.pdf",
    sourceProvider: "Supreme Court of Pakistan (Demo)",
    text: `[DEMO TEST FIXTURE — synthetic judgment for RAG testing only]

JUDGMENT
Qazi Faez Isa, J.- The appellant in this civil appeal challenges the dismissal of its arbitration application under Section 14 of the Arbitration Act, 1940 by the High Court. The dispute arises out of a public works contract for road construction awarded by the National Highway Authority ("NHA") in 2018, containing an arbitration clause invoking the procedure under the 1940 Act.

2. The narrow question for determination is whether a public-sector employer may unilaterally rescind the arbitration mechanism after a dispute has crystallised, and whether such repudiation amounts to a "wrongful refusal to arbitrate" giving rise to a cause of action under Section 20 of the Act.

3. The settled position is that an arbitration clause in a contract is a separable agreement, the obligations of which survive the substantive contract. Once a dispute arises and one party invokes the clause, the other party is bound to participate. A unilateral notice purporting to terminate the arbitration mechanism after the dispute has crystallised has no legal effect and does not relieve the party from its obligation to arbitrate.

4. Where, as here, the employer is a statutory authority, additional principles apply. Public bodies are bound by Article 4 of the Constitution to act in accordance with law. They cannot, by virtue of their dominant bargaining position, evade contractual obligations freely undertaken. The doctrine of fair dealing and reasonableness — a constitutional incident of administrative action recognised since Pakistan v. Public at Large (PLD 1989 SC 304) — applies with equal force to commercial contracts entered into by the State.

5. The High Court's dismissal of the arbitration application is therefore unsustainable. The appeal is allowed and the matter is remanded with a direction to refer the parties to arbitration in accordance with the contractually stipulated procedure. Costs throughout shall abide the result of the arbitration.

Appeal allowed.`
  }
];

const TIMINGS = { ingested: 0, skipped: 0, failed: 0 };

async function main() {
  console.log("→ Case-law seeder starting\n");

  if (!isOpenAiConfigured()) {
    fail("OPENAI_API_KEY is not set in backend/.env");
  }
  if (!isPineconeConfigured()) {
    fail("PINECONE_API_KEY or PINECONE_INDEX is not set in backend/.env");
  }

  console.log(`  • Pinecone index : ${ragConfig.pinecone.indexName}`);
  console.log(`  • Case-law ns    : ${ragConfig.pinecone.caseLawNamespace}`);
  console.log(`  • Embedding dims : ${ragConfig.embeddingDimensions}`);
  console.log(`  • Seeds queued   : ${SEEDS.length}\n`);

  console.log("→ Connecting to MongoDB...");
  await connectMongo();
  console.log("  ✓ connected\n");

  const args = new Set(process.argv.slice(2));
  if (args.has("--reset")) {
    console.log("→ --reset flag detected — wiping prior demo rows...");
    const prior = await CaseLaw.find({
      $or: [
        { citation: { $regex: /^DEMO /i } },
        { sourceProvider: { $regex: /\(Demo\)$/i } }
      ]
    });
    for (const row of prior) {
      try {
        await ingestService.deleteCaseLaw(row._id);
        console.log(`  ✓ removed: ${row.title}`);
      } catch (err) {
        console.log(`  ! failed to remove ${row.title}: ${err.message}`);
      }
    }
    console.log("");
  }

  for (let i = 0; i < SEEDS.length; i += 1) {
    const seed = SEEDS[i];
    const label = `[${i + 1}/${SEEDS.length}] ${seed.title}`;
    console.log(`→ ${label}`);
    console.log(`     ${seed.court} · ${seed.year} · ${seed.citation}`);

    const t0 = Date.now();
    try {
      const result = await ingestService.ingestCaseLaw(seed);
      const elapsed = Date.now() - t0;
      console.log(`     ✓ indexed in ${elapsed}ms — ${result.chunkCount} chunks (${result.embeddingModel})\n`);
      TIMINGS.ingested += 1;
    } catch (err) {
      console.error(`     ✗ failed: ${err.message}\n`);
      TIMINGS.failed += 1;
    }
  }

  console.log("─".repeat(60));
  console.log(`✓ ingested : ${TIMINGS.ingested}`);
  console.log(`✗ failed   : ${TIMINGS.failed}`);
  console.log(`◌ skipped  : ${TIMINGS.skipped}`);
  console.log("─".repeat(60));

  if (TIMINGS.ingested > 0) {
    console.log("\nNote: Pinecone serverless is eventually consistent. New vectors");
    console.log("typically become queryable within 5–15 seconds. If the AI assistant");
    console.log("returns no citations on the first try, wait a moment and retry.");
  }

  await mongoose.disconnect();
  process.exit(TIMINGS.failed > 0 ? 1 : 0);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

main().catch(async (err) => {
  console.error("\n✗ Seeder crashed:", err?.message || err);
  if (err?.stack) console.error(err.stack);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
