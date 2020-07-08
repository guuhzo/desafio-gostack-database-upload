import { join } from 'path';
import fs from 'fs';
import csv from 'csv-parse';

// import Transaction from '../models/Transaction';
import { getRepository, In, getCustomRepository } from 'typeorm';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionCsvRow {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryName: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const filePath = join(uploadConfig.directory, fileName);
    const fileExist = await fs.promises.stat(filePath);

    if (!fileExist) throw new AppError('file not provided');

    const transactionsCsv: TransactionCsvRow[] = [];
    const categoriesCsv: string[] = [];
    const parsedCsv = fs.createReadStream(filePath).pipe(csv({ from_line: 2 }));
    parsedCsv.on('data', row => {
      const [title, type, value, categoryName] = row.map((cell: string) =>
        cell.trim(),
      );
      const transactionCsvRow = {
        title,
        type,
        value,
        categoryName,
      } as TransactionCsvRow;

      transactionsCsv.push(transactionCsvRow);
      categoriesCsv.push(categoryName);
    });
    await new Promise(resolve => parsedCsv.on('end', resolve));

    const categoriesRepository = getRepository(Category);
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categoriesCsv) },
    });
    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );
    const newCategoriesTitle = categoriesCsv
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((category, index, self) => self.indexOf(category) === index);

    const newCategories = categoriesRepository.create(
      newCategoriesTitle.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const newTransactions = transactionRepository.create(
      transactionsCsv.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.categoryName,
        ),
      })),
    );
    await transactionRepository.save(newTransactions);

    return newTransactions;
  }
}

export default ImportTransactionsService;
