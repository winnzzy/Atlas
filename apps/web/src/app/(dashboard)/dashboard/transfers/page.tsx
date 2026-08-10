'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { createTransfer, getTransfers } from '@/lib/demo-store';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState(getTransfers());
  const [beneficiary, setBeneficiary] = useState('Northwind Capital');
  const [amount, setAmount] = useState('2500');
  const [type, setType] = useState('Domestic');
  const [description, setDescription] = useState('Quarterly invoice');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createTransfer({
      beneficiary,
      amount: Number(amount),
      type: type as 'Domestic' | 'International' | 'Same Day',
      description,
    });
    setTransfers(getTransfers());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Beneficiary</label>
                <Input
                  value={beneficiary}
                  onChange={(event) => setBeneficiary(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                <Select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="Domestic">Domestic</option>
                  <option value="International">International</option>
                  <option value="Same Day">Same Day</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Submit transfer</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th>Reference</Th>
                  <Th>Beneficiary</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transfers.map((transfer) => (
                  <Tr key={transfer.id}>
                    <Td>{transfer.reference}</Td>
                    <Td>{transfer.beneficiary}</Td>
                    <Td>${transfer.amount.toLocaleString()}</Td>
                    <Td>{transfer.status}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
