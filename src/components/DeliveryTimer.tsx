"use client";

import React, { useState, useEffect } from 'react';
import { differenceInSeconds, addHours, addDays } from 'date-fns';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeliveryTimerProps {
    orderDate: string;
    shippingMethod: string; // 'pickup', 'economy', 'normal', 'express'
}

export default function DeliveryTimer({ orderDate, shippingMethod }: DeliveryTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>('Calculating...');
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        if (!orderDate) return;

        const calculateDeliveryTime = () => {
            const start = new Date(orderDate);
            let end = new Date(start);

            // Estimate delivery time based on method
            // Using average times from checkout/page.tsx definitions
            switch (shippingMethod.toLowerCase()) {
                case 'express':
                    // 1-2 business days -> Max 2 days
                    end = addDays(start, 2);
                    break;
                case 'normal':
                case 'standard':
                    // 2-4 business days -> Max 4 days
                    end = addDays(start, 4);
                    break;
                case 'economy':
                    // 5-7 business days -> Max 7 days
                    end = addDays(start, 7);
                    break;
                case 'pickup':
                    // Store Pickup - usually ready same day or next max 24h
                    end = addHours(start, 24);
                    break;
                default:
                    // Default fallback
                    end = addDays(start, 5);
                    break;
            }

            const now = new Date();
            const diff = differenceInSeconds(end, now);

            if (diff <= 0) {
                setTimeLeft('Due now');
                setIsLate(true);
                return;
            }

            const days = Math.floor(diff / (3600 * 24));
            const hours = Math.floor((diff % (3600 * 24)) / 3600);
            const minutes = Math.floor((diff % 3600) / 60);

            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            if (hours > 0) timeString += `${hours}h `;
            timeString += `${minutes}m`;

            setTimeLeft(timeString);
            setIsLate(false);
        };

        calculateDeliveryTime();
        const timer = setInterval(calculateDeliveryTime, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [orderDate, shippingMethod]);


    return (
        <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock size={14} /> Estimated Arrival:
            </span>
            <Badge variant={isLate ? "destructive" : "secondary"} className="text-sm font-mono">
                {timeLeft}
            </Badge>
        </div>
    );
}
