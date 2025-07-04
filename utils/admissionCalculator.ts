// --- Типы (лучше вынести в types/AdmissionTypes.ts) ---

export interface HistoricalRow {
  year: number;
  tour: number;
  educationType: 'budget' | 'contract';
  region?: string;
  faculty: string;
  minScore: number;
  maxScore?: number;
}

export interface TourResult {
  tour: number;
  weightedMin: number;
  weightedMax?: number;
  userScore: number;
  chancePercentage: number;
  category: string;
  color: string;
}

// --- Класс ---

export class AdmissionCalculator {
  private weights = new Map<number, number>([
    [2024, 0.45],
    [2023, 0.35],
    [2022, 0.05],
    [2021, 0.15],
  ]);

  constructor(private data: HistoricalRow[]) {}

  public calculate(
    userScore: number,
    educationType: 'budget' | 'contract',
    region?: string
  ): TourResult[] {
    const results: TourResult[] = [];
    for (let tour = 1; tour <= 5; tour++) {
      const filtered = this.filterData(tour, educationType, region);
      if (!filtered.length) continue;
      const cleanData = this.removeAnomalies(filtered);
      const { weightedMin, weightedMax } = this.computeWeighted(cleanData);

      const chance = educationType === 'budget'
        ? this.computeBudgetChance(userScore, weightedMin)
        : this.computeContractChance(userScore, weightedMin, weightedMax);

      results.push({
        tour,
        weightedMin,
        weightedMax,
        userScore,
        ...chance,
      });
    }
    return results;
  }

  private filterData(tour: number, educationType: string, region?: string) {
    return this.data.filter(r =>
      r.tour === tour &&
      r.educationType === educationType &&
      (!region || r.region === region)
    );
  }

  private removeAnomalies(data: HistoricalRow[]) {
    const hasOtherYears = data.some(d => d.year !== 2022);
    return data.filter(d =>
      (!hasOtherYears || d.year !== 2022) &&
      d.minScore <= (d.maxScore ?? d.minScore)
    );
  }

  private computeWeighted(data: HistoricalRow[]) {
    let sumWeight = 0, sumMin = 0, sumMax = 0;
    for (const d of data) {
      const w = this.weights.get(d.year) || 0.1;
      sumWeight += w;
      sumMin += d.minScore * w;
      sumMax += (d.maxScore ?? d.minScore) * w;
    }
    return { weightedMin: sumMin / sumWeight, weightedMax: sumMax / sumWeight };
  }

  private computeBudgetChance(score: number, min: number) {
    if (score >= min + 25) return this.pack(77.5, "Высокие", "🟢");
    if (score >= min + 15) return this.pack(62.5, "Хорошие", "🟢");
    if (score >= min + 5) return this.pack(45, "Средние", "🟡");
    if (score >= min) return this.pack(25, "Ниже среднего", "🟡");
    if (score >= min - 20) return this.pack(10, "Низкие", "🔴");
    return this.pack(2.5, "Очень низкие", "🔴");
  }

  private computeContractChance(score: number, min: number, max?: number) {
    const mid = (min + (max ?? min)) / 2;
    const upper = mid + ((max ?? mid) - mid) / 2;
    if (score >= (max ?? mid) + 15) return this.pack(92.5, "Очень высокие", "🟢");
    if (score >= (max ?? mid)) return this.pack(85, "Высокие", "🟢");
    if (score >= upper) return this.pack(72.5, "Хорошие", "🟢");
    if (score >= mid) return this.pack(55, "Средние", "🟡");
    if (score >= min + 15) return this.pack(35, "Ниже среднего", "🟡");
    if (score >= min) return this.pack(17.5, "Низкие", "🔴");
    return this.pack(5, "Очень низкие", "🔴");
  }

  private pack(p: number, cat: string, color: string) {
    return { chancePercentage: p, category: cat, color };
  }
}

// --- Функция-обёртка ---

/**
 * calculateAdmissionChance - быстрая функция для получения анализа по одному туру
 * @param args объект с параметрами пользователя и тура
 * @returns результат тура (TourResult)
 */
export function calculateAdmissionChance(args: {
  faculty: string;
  educationType: 'budget' | 'contract';
  region?: string;
  userScore: number;
  tour: number;
}): TourResult {
  const { faculty, educationType, region, userScore, tour } = args;
  const historicalData = getHistoricalData(faculty, educationType, region);
  const calc = new AdmissionCalculator(historicalData);
  const allResults = calc.calculate(userScore, educationType, region);
  const result = allResults.find(r => r.tour === tour);

  if (!result) throw new Error(`Нет данных по туру ${tour}`);
  return result;
}

// --- Заглушка для получения исторических данных ---
// В реальном проекте замени на загрузку из БД, файла или API

function getHistoricalData(
  faculty: string,
  educationType: 'budget' | 'contract',
  region?: string
): HistoricalRow[] {
  // Пример. Подключи свою реальную коллекцию данных!
  const example: HistoricalRow[] = [
    // Пример строки
    {
      year: 2024, tour: 1, educationType: 'budget', region: 'г.Бишкек',
      faculty: 'Лечебное дело', minScore: 225, maxScore: 265,
    },
    // ...подгрузи сюда все нужные данные
  ];
  // Примитивная фильтрация — дополни как надо!
  return example.filter(row =>
    row.faculty === faculty &&
    row.educationType === educationType &&
    (educationType === 'budget'
      ? (!region || row.region === region)
      : true)
  );
}
