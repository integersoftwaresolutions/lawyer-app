import { useEffect, useState } from "react";
import { walletApi } from "../../services/wallet.api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState(10);

  async function load() {
    const res = await walletApi.me();
    setWallet(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function topup() {
    await walletApi.topup({ amount: Number(amount), note: "Manual topup" });
    await load();
  }

  if (!wallet) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Wallet</h2>
      <Card>
        <div>Balance credits: <b>{wallet.balanceCredits}</b></div>
        <div>Monthly credits: <b>{wallet.monthlyCredits}</b></div>
      </Card>

      <div className="flex gap-2 items-center">
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button onClick={topup}>Top up</Button>
      </div>
    </div>
  );
}
