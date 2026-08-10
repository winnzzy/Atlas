'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { freezeCard, getCards, unfreezeCard } from '@/lib/demo-store';

export default function CardsPage() {
  const [cards, setCards] = useState(getCards());

  const toggleCard = (cardId: string, status: string) => {
    if (status === 'ACTIVE') {
      freezeCard(cardId);
    } else {
      unfreezeCard(cardId);
    }
    setCards(getCards());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {cards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle>{card.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Masked number</p>
                <p className="text-lg font-semibold text-slate-900">{card.maskedNumber}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant={card.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {card.status}
                  </Badge>
                  <Badge variant="default">Limit ${card.limit.toLocaleString()}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Available</p>
                <p className="text-lg font-semibold text-slate-900">
                  ${card.available.toLocaleString()}
                </p>
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => toggleCard(card.id, card.status)}
                >
                  {card.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
