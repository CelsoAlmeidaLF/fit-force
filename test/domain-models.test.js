import test from 'node:test';
import assert from 'node:assert/strict';

import { CalorieCalculatorModel } from '../src/domain/models/CalorieCalculatorModel.js';
import { OneRepMaxModel } from '../src/domain/models/OneRepMaxModel.js';
import { PlateCalculatorModel } from '../src/domain/models/PlateCalculatorModel.js';
import { MuscleRecoveryModel } from '../src/domain/models/MuscleRecoveryModel.js';
import { WeeklyVolumeModel } from '../src/domain/models/WeeklyVolumeModel.js';
import { Muscle } from '../src/domain/entities/Muscle.js';
import { Exercise } from '../src/domain/entities/Exercise.js';
import { WorkoutSession } from '../src/domain/entities/WorkoutSession.js';

test('CalorieCalculatorModel: cálculo de calorias totais com fórmula MET oficial', () => {
  // 60 min, 80 kg, MET 3.5 = 3.5 * 80 * 60 / 60 = 280 kcal
  const kcal = CalorieCalculatorModel.calculateTotalCalories(60, 80, 3.5);
  assert.equal(kcal, 280);

  // Valores zerados ou nulos devem retornar 0 sem estourar exceção
  assert.equal(CalorieCalculatorModel.calculateTotalCalories(0, 80, 3.5), 0);
  assert.equal(CalorieCalculatorModel.calculateTotalCalories(60, 0, 3.5), 0);
  assert.equal(CalorieCalculatorModel.calculateTotalCalories(-10, 80, 3.5), 0);
});

test('CalorieCalculatorModel: identificação de MET para exercícios compostos vs isoladores', () => {
  // Compostos devem receber MET 5.0
  assert.equal(CalorieCalculatorModel.getExerciseMet('Supino reto'), 5.0);
  assert.equal(CalorieCalculatorModel.getExerciseMet('Agachamento livre'), 5.0);
  assert.equal(CalorieCalculatorModel.getExerciseMet('Levantamento terra'), 5.0);

  // Isoladores com músculos de recuperação padrão (48h) devem receber MET 3.5
  assert.equal(CalorieCalculatorModel.getExerciseMet('Rosca direta', 48), 3.5);
  assert.equal(CalorieCalculatorModel.getExerciseMet('Elevação lateral', 48), 3.5);
});

test('OneRepMaxModel: estimativa de 1RM pela fórmula de Epley', () => {
  // 100 kg para 10 repetições: 100 * (1 + 10/30) = 133.33 kg
  const e1rm10 = OneRepMaxModel.estimate1RM(100, 10);
  assert.equal(Math.round(e1rm10 * 100) / 100, 133.33);

  // 1 repetição máxima: 100 kg * 1 = 100 kg
  const e1rm1 = OneRepMaxModel.estimate1RM(100, 1);
  assert.equal(e1rm1, 100);

  // Repetições acima de 15 fogem da precisão do modelo e devem retornar 0
  assert.equal(OneRepMaxModel.estimate1RM(100, 20), 0);
  assert.equal(OneRepMaxModel.estimate1RM(0, 10), 0);
});

test('OneRepMaxModel: sugestão de sobrecarga progressiva e quebra de recorde', () => {
  assert.equal(OneRepMaxModel.suggestNextLoad(80, 2.5), 82.5);
  assert.equal(OneRepMaxModel.suggestNextLoad(0, 2.5), 0);

  const records = { 'Supino reto': 100 };
  // 90 kg x 5 reps = 90 * (1 + 5/30) = 105 kg (Novo recorde)
  assert.equal(OneRepMaxModel.isPersonalRecord('Supino reto', 90, 5, records), true);
  // 70 kg x 10 reps = 70 * (1 + 10/30) = 93.33 kg (Abaixo do recorde)
  assert.equal(OneRepMaxModel.isPersonalRecord('Supino reto', 70, 10, records), false);
});

test('PlateCalculatorModel: decomposição de anilhas por lado para barra olímpica', () => {
  // Alvo: 60 kg (barra de 20 kg + 40 kg em anilhas = 20 kg por lado)
  const calc60 = PlateCalculatorModel.calculatePlates(60, 20);
  assert.equal(calc60.achievedTotalKg, 60);
  assert.equal(calc60.perSideTotalKg, 20);
  assert.deepEqual(calc60.plates, [{ kg: 20, count: 1 }]);

  // Alvo: 72.5 kg (barra de 20 kg + 52.5 kg = 26.25 kg por lado -> 20 + 5 + 1.25)
  const calc72 = PlateCalculatorModel.calculatePlates(72.5, 20);
  assert.equal(calc72.achievedTotalKg, 72.5);
  assert.equal(calc72.perSideTotalKg, 26.25);
  assert.deepEqual(calc72.plates, [
    { kg: 20, count: 1 },
    { kg: 5, count: 1 },
    { kg: 1.25, count: 1 }
  ]);

  // Alvo menor que a barra
  const calc15 = PlateCalculatorModel.calculatePlates(15, 20);
  assert.equal(calc15.perSideTotalKg, 0);
  assert.equal(calc15.achievedTotalKg, 20);
});

test('MuscleRecoveryModel: cálculo de fadiga e tempo de recuperação por volume', () => {
  const fakeMuscles = {
    'peitoral-maior': { id: 'peitoral-maior', h: 48 },
    'triceps-braquial-geral': { id: 'triceps-braquial-geral', h: 48 }
  };

  const now = Date.now();
  const workouts = [
    {
      t: now - 3600 * 1000 * 10, // Treinado há 10 horas
      ex: [
        {
          m: 'peitoral-maior',
          sec: ['triceps-braquial-geral'],
          sets: [{ kg: 80, reps: 10 }, { kg: 80, reps: 10 }, { kg: 80, reps: 10 }]
        }
      ]
    }
  ];

  const fatigue = MuscleRecoveryModel.computeFatigue(workouts, fakeMuscles);
  assert.ok(fatigue['peitoral-maior']);
  assert.equal(fatigue['peitoral-maior'].volume, 3);
  assert.ok(fatigue['triceps-braquial-geral']);
  assert.equal(fatigue['triceps-braquial-geral'].volume, 1.5); // 50% de volume por ser sinérgico

  const statusPeito = MuscleRecoveryModel.getMuscleStatus('peitoral-maior', fatigue, {}, now);
  // Treinado há 10h de uma janela de recuperação de ~50h: ainda recuperando
  assert.equal(statusPeito.key, 'bad');
});

test('WeeklyVolumeModel: consolidação de volume em 7 dias e balanço push/pull', () => {
  const now = Date.now();
  const fakeExercises = {
    'Supino reto': { name: 'Supino reto', group: 'Peito' },
    'Puxada frontal': { name: 'Puxada frontal', group: 'Costas' }
  };

  const workouts = [
    {
      t: now - 24 * 3600 * 1000,
      kcal: 300,
      ex: [
        { name: 'Supino reto', sets: [{ kg: 80, reps: 10 }, { kg: 80, reps: 10 }, { kg: 80, reps: 10 }, { kg: 80, reps: 10 }] },
        { name: 'Puxada frontal', sets: [{ kg: 60, reps: 10 }, { kg: 60, reps: 10 }, { kg: 60, reps: 10 }, { kg: 60, reps: 10 }] }
      ]
    }
  ];

  const report = WeeklyVolumeModel.calculate7DaysVolume(workouts, fakeExercises, {}, now);
  assert.equal(report.recentWorkoutsCount, 1);
  assert.equal(report.totalCalories7Days, 300);
  assert.equal(report.groupSets['Peito'], 4);
  assert.equal(report.groupSets['Costas'], 4);
  assert.equal(report.pushSets, 4);
  assert.equal(report.pullSets, 4);
  assert.equal(report.pushPullRatio, 1.0); // Equilíbrio perfeito 1:1
});
