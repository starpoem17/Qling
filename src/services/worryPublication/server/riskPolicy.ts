import type { ConcernAnalysis } from '../../matching/server/concernAnalysis';

export interface HighRiskBlockResult {
  status: 'risk_blocked';
  code: 'high_risk';
  message: string;
  helpMessage: string;
}

const HIGH_RISK_MESSAGE = '지금 내용은 안전을 먼저 확인해야 하는 고민으로 판단되어 익명 전달을 중단했어요.';
const HIGH_RISK_HELP_MESSAGE = [
  '지금 당장 위험하거나 스스로를 해칠 것 같다면 119 또는 112에 바로 연락해 주세요.',
  '자살예방상담전화 109, 정신건강위기상담 1577-0199에서도 도움을 받을 수 있어요.',
  '가능하다면 가까운 사람에게 지금 혼자 있기 어렵다고 알려 주세요.',
].join('\n');

export function shouldBlockHighRiskConcern(concern: Pick<ConcernAnalysis, 'riskLevel'>): boolean {
  return concern.riskLevel === 'high';
}

export function buildHighRiskBlockResult(): HighRiskBlockResult {
  return {
    status: 'risk_blocked',
    code: 'high_risk',
    message: HIGH_RISK_MESSAGE,
    helpMessage: HIGH_RISK_HELP_MESSAGE,
  };
}
