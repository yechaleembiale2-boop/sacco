import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { TrialBalanceRow } from './reports.service';

@Injectable()
export class ExcelService {
  async trialBalanceToBuffer(rows: TrialBalanceRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Injibara University SACCO';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Trial Balance');

    sheet.columns = [
      { header: 'Code', key: 'code', width: 10 },
      { header: 'Account', key: 'name', width: 30 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Debit', key: 'totalDebit', width: 18 },
      { header: 'Credit', key: 'totalCredit', width: 18 },
      { header: 'Balance', key: 'balance', width: 18 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };

    for (const row of rows) {
      sheet.addRow(row);
    }

    // Add totals row
    const totalDebit = rows
      .reduce((s, r) => s + Number(r.totalDebit), 0)
      .toFixed(2);
    const totalCredit = rows
      .reduce((s, r) => s + Number(r.totalCredit), 0)
      .toFixed(2);

    const totalRow = sheet.addRow({
      code: '',
      name: 'TOTAL',
      type: '',
      totalDebit,
      totalCredit,
      balance: '',
    });
    totalRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}