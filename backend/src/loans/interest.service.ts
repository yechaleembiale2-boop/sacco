import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';

export interface ScheduleRow {
  installmentNo: number;
  dueDate: string;
  principalDue: string;
  interestDue: string;
  totalDue: string;
}

@Injectable()
export class InterestService {
  calculateSchedule(
    principal: string,
    annualRatePercent: string,
    termMonths: number,
    startDate: Date = new Date(),
  ): { rows: ScheduleRow[]; totalInterest: string; totalPayable: string } {
    const P = new Decimal(principal);
    const annualRate = new Decimal(annualRatePercent).div(100);
    const monthlyRate = annualRate.div(12);
    const n = termMonths;

    let monthlyPayment: Decimal;
    if (monthlyRate.eq(0)) {
      monthlyPayment = P.div(n);
    } else {
      const factor = new Decimal(1).plus(monthlyRate).pow(-n);
      monthlyPayment = P.times(monthlyRate).div(new Decimal(1).minus(factor));
    }

    const rows: ScheduleRow[] = [];
    let balance = P;
    let totalInterest = new Decimal(0);
    let totalPayable = new Decimal(0);

    for (let i = 1; i <= n; i++) {
      const interest = balance.times(monthlyRate);
      let principalPart = monthlyPayment.minus(interest);
      if (i === n) principalPart = balance;
      balance = balance.minus(principalPart);
      if (balance.lessThan(0)) balance = new Decimal(0);
      const total = principalPart.plus(interest);
      totalInterest = totalInterest.plus(interest);
      totalPayable = totalPayable.plus(total);
      const due = new Date(startDate);
      due.setMonth(due.getMonth() + i);
      rows.push({
        installmentNo: i,
        dueDate: due.toISOString().slice(0, 10),
        principalDue: principalPart.toFixed(2),
        interestDue: interest.toFixed(2),
        totalDue: total.toFixed(2),
      });
    }

    return {
      rows,
      totalInterest: totalInterest.toFixed(2),
      totalPayable: totalPayable.toFixed(2),
    };
  }
}