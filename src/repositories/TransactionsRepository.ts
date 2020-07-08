import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsIncome = await this.find({ where: { type: 'income' } });
    const transactionsOutcome = await this.find({ where: { type: 'outcome' } });

    const income = transactionsIncome.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.value;
    }, 0);

    const outcome = transactionsOutcome.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.value;
    }, 0);

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
