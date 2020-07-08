import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('type input is invalid');
    }

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('the outcome provided is greater than total');
    }

    const existedCategory = await categoryRepository.findOne({
      where: { title: categoryName },
    });

    if (!existedCategory) {
      const category = categoryRepository.create({ title: categoryName });
      await categoryRepository.save(category);
    }

    const category = (await categoryRepository.findOne({
      where: { title: categoryName },
    })) as Category;

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: category.id,
    });
    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
