// import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(transaction_id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne({
      where: { id: transaction_id },
    });
    if (!transaction) throw new AppError('transaction not found', 404);

    await transactionsRepository.delete({ id: transaction.id });
  }
}

export default DeleteTransactionService;
