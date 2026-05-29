'use client';

import { createContext, useContext, useId, useMemo, useState } from 'react';
import { AlertCircle, Banknote, BellRing, Clipboard, FileDown, Gavel, Plus, RotateCcw, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';

type DraftType = 'loan' | 'notice' | 'order';
type LoanCount = '1회' | '2회' | '3회' | '3회 그 이상';
type RepayTiming = 'immediate' | 'deadline';
type EvidenceKind = 'transfer' | 'message' | 'signed-doc' | 'partial-repay' | 'recording' | 'other';
type LoanSpecialOption = 'installment' | 'early-repay' | 'guarantor' | 'collateral' | 'no-transfer';
type NoticeFollowupOption = 'payment-order' | 'small-claim' | 'civil-suit' | 'criminal-review';
type OrderAttachment = 'loan-agreement' | 'transfer-record' | 'content-certified-mail' | 'delivery-proof' | 'message-capture' | 'partial-repayment' | 'recording' | 'id-info' | 'other';
type OrderCheck = 'debtor-address' | 'claim-amount' | 'interest' | 'evidence' | 'objection' | 'submission';

type EvidenceFile = {
  id: string;
  name: string;
  kind: EvidenceKind;
  previewUrl: string | null;
  fileType: string;
};

type LoanRecord = {
  id: string;
  date: string;
  amount: string;
  dueDate: string;
  memo: string;
};

type LoanForm = {
  creditorName: string;
  creditorAddress: string;
  creditorPhone: string;
  debtorName: string;
  debtorAddress: string;
  debtorPhone: string;
  amount: string;
  loanDate: string;
  dueDate: string;
  loanCount: LoanCount;
  loanRecords: LoanRecord[];
  loanHistory: string;
  hasInterest: boolean;
  interestRate: string;
  hasLateFee: boolean;
  lateFeeRate: string;
  repaymentAccount: string;
  specialOptions: LoanSpecialOption[];
  specialTerms: string;
  writtenDate: string;
};

type NoticeForm = {
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  amount: string;
  loanDate: string;
  loanCount: LoanCount;
  loanRecords: LoanRecord[];
  loanHistory: string;
  partialPaid: boolean;
  paidAmount: string;
  remainingAmount: string;
  promisedDate: string;
  repayTiming: RepayTiming;
  requestDueDate: string;
  hasSpecialDamage: boolean;
  specialDamage: string;
  includeAccount: boolean;
  repaymentAccount: string;
  followupOptions: NoticeFollowupOption[];
  evidenceMemo: string;
  evidenceFiles: EvidenceFile[];
  sentDate: string;
};

type PaymentOrderForm = {
  creditorName: string;
  creditorAddress: string;
  creditorPhone: string;
  debtorName: string;
  debtorAddress: string;
  debtorPhone: string;
  claimAmount: string;
  loanDate: string;
  promisedDate: string;
  remainingAmount: string;
  includeInterest: boolean;
  interestBasis: string;
  claimReason: string;
  attachments: OrderAttachment[];
  attachmentCounts: Partial<Record<OrderAttachment, number>>;
  evidenceMemo: string;
  evidenceMemoCount: number;
  preSubmitChecks: OrderCheck[];
  courtMemo: string;
  preparedDate: string;
};

type Section = {
  title: string;
  current: number;
  total: number;
  done: number;
  required: number;
  body: React.ReactNode;
};

const ExampleFocusContext = createContext<{
  onExampleFocus: (labels: string[], terms?: string[]) => void;
  onExampleBlur: () => void;
} | null>(null);

const today = new Date().toISOString().slice(0, 10);

const emptyLoan: LoanForm = {
  creditorName: '',
  creditorAddress: '',
  creditorPhone: '',
  debtorName: '',
  debtorAddress: '',
  debtorPhone: '',
  amount: '',
  loanDate: '',
  dueDate: '',
  loanCount: '1회',
  loanRecords: [],
  loanHistory: '',
  hasInterest: false,
  interestRate: '',
  hasLateFee: false,
  lateFeeRate: '',
  repaymentAccount: '',
  specialOptions: [],
  specialTerms: '',
  writtenDate: today,
};

const emptyNotice: NoticeForm = {
  senderName: '',
  senderAddress: '',
  senderPhone: '',
  receiverName: '',
  receiverAddress: '',
  receiverPhone: '',
  amount: '',
  loanDate: '',
  loanCount: '1회',
  loanRecords: [],
  loanHistory: '',
  partialPaid: false,
  paidAmount: '',
  remainingAmount: '',
  promisedDate: '',
  repayTiming: 'deadline',
  requestDueDate: '',
  hasSpecialDamage: false,
  specialDamage: '',
  includeAccount: true,
  repaymentAccount: '',
  followupOptions: ['payment-order'],
  evidenceMemo: '',
  evidenceFiles: [],
  sentDate: today,
};

const emptyOrder: PaymentOrderForm = {
  creditorName: '',
  creditorAddress: '',
  creditorPhone: '',
  debtorName: '',
  debtorAddress: '',
  debtorPhone: '',
  claimAmount: '',
  loanDate: '',
  promisedDate: '',
  remainingAmount: '',
  includeInterest: false,
  interestBasis: '',
  claimReason: '',
  attachments: ['loan-agreement', 'transfer-record'],
  attachmentCounts: {
    'loan-agreement': 1,
    'transfer-record': 1,
  },
  evidenceMemo: '',
  evidenceMemoCount: 1,
  preSubmitChecks: ['debtor-address', 'claim-amount', 'evidence', 'objection'],
  courtMemo: '',
  preparedDate: today,
};

const evidenceLabels: Record<EvidenceKind, string> = {
  transfer: '계좌이체 내역',
  message: '문자/카카오톡 대화',
  'signed-doc': '차용증 서명본',
  'partial-repay': '일부 변제 내역',
  recording: '통화 녹음',
  other: '기타 자료',
};

const loanSpecialLabels: Record<LoanSpecialOption, string> = {
  installment: '분할상환 약정',
  'early-repay': '조기상환 허용',
  guarantor: '보증인 있음',
  collateral: '담보 제공',
  'no-transfer': '채권 양도 제한',
};

const loanSpecialSentences: Record<LoanSpecialOption, string> = {
  installment: '채무자는 변제기한 전이라도 당사자가 합의한 일정에 따라 차용금을 나누어 변제할 수 있습니다.',
  'early-repay': '채무자는 변제기한 전이라도 차용금의 전부 또는 일부를 조기 변제할 수 있습니다.',
  guarantor: '보증인이 있는 경우 보증인은 본 차용금 채무의 이행을 보증하며, 보증 범위는 별도 합의한 내용에 따릅니다.',
  collateral: '채무자가 담보를 제공한 경우 담보의 종류와 반환 조건은 당사자가 별도로 확인한 내용에 따릅니다.',
  'no-transfer': '채권자는 채무자의 사전 동의 없이 본 차용증상 채권을 제3자에게 양도하지 않습니다.',
};

const noticeFollowupLabels: Record<NoticeFollowupOption, string> = {
  'payment-order': '지급명령 신청',
  'small-claim': '소액사건/민사소송',
  'civil-suit': '일반 민사소송',
  'criminal-review': '사기 등 형사절차 검토',
};

const noticeFollowupSentences: Record<NoticeFollowupOption, string> = {
  'payment-order': '위 기한까지 변제가 이루어지지 않을 경우 발신인은 지급명령 신청을 검토할 수 있습니다.',
  'small-claim': '청구금액과 사안에 따라 소액사건 또는 민사소송 제기를 검토할 수 있습니다.',
  'civil-suit': '상대방이 채무 자체를 다투는 경우 일반 민사소송 절차를 검토할 수 있습니다.',
  'criminal-review': '처음부터 갚을 의사 없이 돈을 빌린 정황이 명확한 경우 사기 등 형사절차 상담을 검토할 수 있습니다.',
};

const orderAttachmentLabels: Record<OrderAttachment, string> = {
  'loan-agreement': '차용증 또는 금전 대여 약정서',
  'transfer-record': '계좌이체 내역 또는 현금 전달 증빙',
  'content-certified-mail': '내용증명 사본',
  'delivery-proof': '내용증명 배달증명 또는 등기 조회 내역',
  'message-capture': '문자/카카오톡 등 대화 캡처',
  'partial-repayment': '일부 변제 내역',
  recording: '통화 녹음 또는 녹취록',
  'id-info': '상대방 인적사항 확인 자료',
  other: '기타 자료',
};

const orderCheckLabels: Record<OrderCheck, string> = {
  'debtor-address': '채무자의 송달 가능한 주소를 확인함',
  'claim-amount': '청구금액과 남은 미변제 금액을 확인함',
  interest: '이자 또는 지연손해금 청구 근거를 확인함',
  evidence: '차용 및 미변제 사실을 뒷받침할 증거를 정리함',
  objection: '상대방이 이의하면 소송으로 넘어갈 수 있음을 확인함',
  submission: '전자소송 또는 관할 법원 제출 절차를 확인함',
};

const draftStepInfo: Record<DraftType, {
  title: string;
  desc: string;
  where: string;
  why: string;
  next: string;
}> = {
  loan: {
    title: '1. 차용증',
    desc: '돈을 빌려줄 때 증거 만들기',
    where: '당사자가 각자 보관합니다. 법원이나 우체국에 제출하는 문서가 아니라, 나중에 분쟁이 생겼을 때 증거로 쓰는 문서입니다.',
    why: '누가 누구에게 얼마를 언제 빌렸고 언제 갚기로 했는지 명확히 남기기 위해 작성합니다.',
    next: '돈을 실제로 보낼 때는 계좌이체 내역, 카톡/문자 대화, 서명본 사진을 함께 보관하세요.',
  },
  notice: {
    title: '2. 내용증명',
    desc: '안 갚았을 때 공식 요구 기록',
    where: '우체국 창구 또는 인터넷우체국에 접수합니다. 동일한 내용 3부를 준비하는 방식이 일반적입니다.',
    why: '상대방에게 변제를 요구했다는 사실과 보낸 내용을 공식 기록으로 남기기 위해 사용합니다.',
    next: '상대가 기한 내 갚지 않거나 답이 없으면 지급명령, 소액소송 같은 다음 절차를 검토합니다.',
  },
  order: {
    title: '3. 지급명령 신청서',
    desc: '법원에 제출할 신청서 작성',
    where: '대한민국 법원 전자소송 또는 관할 법원에 사용자가 직접 제출합니다. 이 화면은 지급명령 신청서 작성을 돕는 자동작성 폼입니다.',
    why: '법원에 채무자에게 돈을 지급하라는 명령을 구하기 위해 작성합니다. 확정되면 강제집행의 출발점이 될 수 있습니다.',
    next: '상대가 이의하면 일반 민사소송으로 넘어갈 수 있고, 주소나 내용이 부족하면 보정명령이 나올 수 있습니다.',
  },
};

const exampleValues: Record<string, string> = {
  채권자: '김민수',
  채무자: '박지훈',
  발신인: '김민수',
  수신인: '박지훈',
  '채권자 주소': '서울특별시 강남구 테헤란로 123, 5층',
  '채무자 주소': '서울특별시 마포구 월드컵로 45, 302호',
  '발신인 주소': '서울특별시 강남구 테헤란로 123, 5층',
  '수신인 주소': '서울특별시 마포구 월드컵로 45, 302호',
  차용일: '2026년 5월 1일',
  대여일: '2026년 5월 1일',
  변제기한: '2026년 6월 30일',
  '약속한 변제일': '2026년 6월 30일',
  '최종 변제 요청 기한': '2026년 7월 10일',
  작성일: '2026년 5월 20일',
  발송일: '2026년 5월 20일',
  준비일: '2026년 5월 20일',
  차용금액: '3,000,000원',
  대여금액: '1,000,000원',
  금액: '3,000,000원',
  '빌려준 금액': '3,000,000원',
  '남은 금액': '3,000,000원',
  청구금액: '3,000,000원',
  '미변제 금액': '3,000,000원',
  '돌려받은 금액': '500,000원',
  이자율: '5',
  지연손해금율: '12',
  '이자/지연손해금 근거': '연 5% 이자 약정 및 변제기한 이후 연 12% 지연손해금 약정',
  '입금 계좌': '국민은행 123456-01-123456 김민수',
  '특별한 손해': '약속한 날짜에 변제를 받지 못해 계약금 500,000원을 잃었음',
};

const previewExampleTexts = Array.from(new Set(Object.values(exampleValues))).sort((a, b) => b.length - a.length);

function example(label: string) {
  return exampleValues[label] || `${label} 예시`;
}

const fieldExamples: Record<string, { placeholder: string; previewLabels: string[] }> = {
  '돈 빌려준 사람(채권자)': { placeholder: '예: 김민수', previewLabels: ['채권자'] },
  '돈 빌린 사람(채무자)': { placeholder: '예: 박지훈', previewLabels: ['채무자'] },
  '보내는 사람(채권자)': { placeholder: '예: 김민수', previewLabels: ['발신인'] },
  '받는 사람(채무자)': { placeholder: '예: 박지훈', previewLabels: ['수신인'] },
  '채권자 이름': { placeholder: '예: 김민수', previewLabels: ['채권자'] },
  '채무자 이름': { placeholder: '예: 박지훈', previewLabels: ['채무자'] },
  '채권자 주소': { placeholder: '예: 서울특별시 강남구 테헤란로 123, 5층', previewLabels: ['채권자 주소'] },
  '채무자 주소': { placeholder: '예: 서울특별시 마포구 월드컵로 45, 302호', previewLabels: ['채무자 주소'] },
  '보내는 사람 주소': { placeholder: '예: 서울특별시 강남구 테헤란로 123, 5층', previewLabels: ['발신인 주소'] },
  '받는 사람 주소': { placeholder: '예: 서울특별시 마포구 월드컵로 45, 302호', previewLabels: ['수신인 주소'] },
  '채권자 연락처': { placeholder: '예: 010-1234-5678', previewLabels: [] },
  '채무자 연락처': { placeholder: '예: 010-9876-5432', previewLabels: [] },
  '보내는 사람 연락처': { placeholder: '예: 010-1234-5678', previewLabels: [] },
  '받는 사람 연락처': { placeholder: '예: 010-9876-5432', previewLabels: [] },
  차용금액: { placeholder: '예: 3000000', previewLabels: ['차용금액'] },
  대여금액: { placeholder: '예: 1000000', previewLabels: ['대여금액'] },
  '빌려준 금액': { placeholder: '예: 3000000', previewLabels: ['빌려준 금액'] },
  '돌려받은 금액': { placeholder: '예: 500000', previewLabels: ['돌려받은 금액'] },
  '아직 못 받은 금액': { placeholder: '예: 2500000', previewLabels: ['남은 금액'] },
  '청구금액': { placeholder: '예: 3000000', previewLabels: ['청구금액'] },
  '현재 남은 미변제 금액': { placeholder: '예: 2500000', previewLabels: ['미변제 금액'] },
  '돈을 빌려주는 날짜': { placeholder: '예: 2026-05-01', previewLabels: ['차용일'] },
  '돈을 빌려준 날짜': { placeholder: '예: 2026-05-01', previewLabels: ['차용일', '대여일'] },
  대여일: { placeholder: '예: 2026-05-01', previewLabels: ['대여일'] },
  '돈을 갚기로 한 날짜': { placeholder: '예: 2026-06-30', previewLabels: ['변제기한'] },
  '공통 약속 변제일': { placeholder: '예: 2026-06-30', previewLabels: ['약속한 변제일', '변제기한'] },
  '약속한 변제일': { placeholder: '예: 2026-06-30', previewLabels: ['약속한 변제일'] },
  '이 기록의 갚기로 한 날짜(선택)': { placeholder: '예: 2026-06-30', previewLabels: ['변제기한'] },
  '최종 변제 요청 기한': { placeholder: '예: 2026-07-10', previewLabels: ['최종 변제 요청 기한'] },
  작성일: { placeholder: '예: 2026-05-20', previewLabels: ['작성일'] },
  발송일: { placeholder: '예: 2026-05-20', previewLabels: ['발송일'] },
  준비일: { placeholder: '예: 2026-05-20', previewLabels: ['준비일'] },
  '이자율(연 %)': { placeholder: '예: 5', previewLabels: ['이자율'] },
  '지연손해금율(연 %)': { placeholder: '예: 12', previewLabels: ['지연손해금율'] },
  상환계좌: { placeholder: '예: 국민은행 123456-01-123456 김민수', previewLabels: ['입금 계좌'] },
  '입금 계좌': { placeholder: '예: 국민은행 123456-01-123456 김민수', previewLabels: ['입금 계좌'] },
  '특별한 손해 내용': { placeholder: '예: 약속한 날짜에 돈을 받지 못해 계약금 500,000원을 잃었음', previewLabels: ['특별한 손해'] },
  '이자/지연손해금 산정 근거': { placeholder: '예: 연 5% 이자 약정 및 변제기한 이후 연 12% 지연손해금 약정', previewLabels: ['이자/지연손해금 근거'] },
};

function need(value: string, label: string) {
  return value.trim() || example(label);
}

function money(value: string, label = '금액') {
  const raw = value.replace(/[^\d]/g, '');
  if (!raw) return example(label);
  return `${Number(raw).toLocaleString('ko-KR')}원`;
}

function numericMoney(value: string) {
  return Number(value.replace(/[^\d]/g, '') || 0);
}

function loanRecordTotal(records: LoanRecord[]) {
  return records.reduce((sum, record) => sum + numericMoney(record.amount), 0);
}

function loanAmountValue(amount: string, records: LoanRecord[]) {
  const total = loanRecordTotal(records);
  return total > 0 ? String(total) : amount;
}

function koDate(value: string, label: string) {
  if (!value) return example(label);
  const date = new Date(`${value}T00:00:00`);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function compactLines(lines: Array<string | false | null | undefined>) {
  return lines.filter(Boolean).join('\n');
}

function createLoanRecord(): LoanRecord {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: '',
    amount: '',
    dueDate: '',
    memo: '',
  };
}

function loanCountLabel(records: LoanRecord[], fallback: LoanCount) {
  if (records.length === 0) return fallback;
  if (records.length === 1) return '1회';
  if (records.length === 2) return '2회';
  if (records.length === 3) return '3회';
  return '3회 그 이상';
}

function loanRecordLines(records: LoanRecord[], commonDueDate: string) {
  return records.map((record, index) => {
    const detail = [
      koDate(record.date, '대여일'),
      `금 ${money(record.amount, '대여금액')}`,
      `변제기한 ${koDate(record.dueDate || commonDueDate, '변제기한')}`,
      record.memo.trim(),
    ].filter(Boolean).join(' · ');
    return `${index + 1}. ${detail}`;
  });
}

function filled(values: string[]) {
  return values.filter((value) => value.trim()).length;
}

function toggleList<T extends string>(items: T[], value: T) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function clampCount(value: number) {
  return Math.max(1, Math.min(99, value));
}

function requiredList(entries: Array<[string, string]>) {
  return entries.filter(([, value]) => !value.trim()).map(([label]) => label);
}

function missingLoan(form: LoanForm) {
  return requiredList([
    ['채권자 이름', form.creditorName],
    ['채무자 이름', form.debtorName],
    ['차용금액', form.amount],
    ['차용일', form.loanDate],
    ['변제기한', form.dueDate],
    ['작성일', form.writtenDate],
  ]);
}

function missingNotice(form: NoticeForm) {
  const amount = loanAmountValue(form.amount, form.loanRecords);
  return requiredList([
    ['발신인 이름', form.senderName],
    ['발신인 주소', form.senderAddress],
    ['수신인 이름', form.receiverName],
    ['수신인 주소', form.receiverAddress],
    ['빌려준 금액', amount],
    ['차용일', form.loanDate],
    ['약속한 변제일', form.promisedDate],
    ['최종 변제 요청 기한', form.requestDueDate],
    ['발송일', form.sentDate],
  ]);
}

function missingOrder(form: PaymentOrderForm) {
  return requiredList([
    ['채권자 이름', form.creditorName],
    ['채권자 주소', form.creditorAddress],
    ['채무자 이름', form.debtorName],
    ['채무자 주소', form.debtorAddress],
    ['청구금액', form.claimAmount],
    ['차용일', form.loanDate],
    ['약속한 변제일', form.promisedDate],
    ['준비일', form.preparedDate],
  ]);
}

function loanText(form: LoanForm) {
  const creditor = need(form.creditorName, '채권자');
  const debtor = need(form.debtorName, '채무자');
  const specialLines = [
    ...form.specialOptions.map((option) => loanSpecialSentences[option]),
    form.specialTerms.trim() && `기타 특약: ${form.specialTerms.trim()}`,
  ].filter(Boolean);
  return compactLines([
    '금전차용증',
    '',
    `채권자 ${creditor}와 채무자 ${debtor}는 아래와 같이 금전 차용 사실 및 변제 약정을 확인합니다.`,
    '',
    '1. 당사자',
    `채권자: ${creditor}`,
    form.creditorAddress && `채권자 주소: ${form.creditorAddress}`,
    form.creditorPhone && `채권자 연락처: ${form.creditorPhone}`,
    `채무자: ${debtor}`,
    form.debtorAddress && `채무자 주소: ${form.debtorAddress}`,
    form.debtorPhone && `채무자 연락처: ${form.debtorPhone}`,
    '',
    '2. 차용 내용',
    `채무자는 ${koDate(form.loanDate, '차용일')} 채권자로부터 금 ${money(form.amount, '차용금액')}을 차용하였습니다.`,
    '',
    '3. 변제 방법',
    `${debtor}은(는) ${koDate(form.dueDate, '변제기한')}까지 위 차용금을 ${creditor}에게 변제합니다.`,
    form.repaymentAccount && `상환계좌: ${form.repaymentAccount}`,
    '',
    '4. 이자 및 지연손해금',
    form.hasInterest ? `이자는 연 ${need(form.interestRate, '이자율')}%로 정합니다.` : '당사자는 별도의 이자를 약정하지 않았습니다.',
    form.hasLateFee ? `변제기한을 넘긴 경우 지연손해금은 연 ${need(form.lateFeeRate, '지연손해금율')}%로 정합니다.` : '당사자는 별도의 지연손해금을 약정하지 않았습니다.',
    '',
    specialLines.length > 0 && '5. 특약사항',
    ...specialLines,
    '',
    '위 내용을 확인하고 당사자는 본 차용증을 작성합니다.',
    '',
    koDate(form.writtenDate, '작성일'),
    '',
    `채권자: ${creditor} (서명 또는 인)`,
    `채무자: ${debtor} (서명 또는 인)`,
  ]);
}

function noticeText(form: NoticeForm) {
  const sender = need(form.senderName, '발신인');
  const receiver = need(form.receiverName, '수신인');
  const amount = loanAmountValue(form.amount, form.loanRecords);
  const remaining = form.partialPaid ? money(form.remainingAmount, '남은 금액') : money(amount, '빌려준 금액');
  const deadline = form.repayTiming === 'immediate'
    ? '본 내용증명을 받은 즉시'
    : `${koDate(form.requestDueDate, '최종 변제 요청 기한')}까지`;
  const evidenceSummary = [
    form.evidenceMemo,
    ...form.evidenceFiles.map((file) => `${evidenceLabels[file.kind]}: ${file.name}`),
  ].filter(Boolean).join(' / ');
  const followupLines = form.followupOptions.map((option) => noticeFollowupSentences[option]);
  const evidenceAndFollowupLines = [
    evidenceSummary && `관련 증거 및 참고사항: ${evidenceSummary}`,
    ...followupLines,
    form.evidenceFiles.length > 0 && '별첨자료가 있는 경우 원본 또는 사본을 함께 보관하시기 바랍니다.',
  ].filter(Boolean);
  const recordLines = loanRecordLines(form.loanRecords, form.promisedDate);
  return compactLines([
    '내용증명',
    '',
    '당사자',
    `발신인: ${sender}`,
    `주소: ${need(form.senderAddress, '발신인 주소')}`,
    form.senderPhone && `연락처: ${form.senderPhone}`,
    '',
    `수신인: ${receiver}`,
    `주소: ${need(form.receiverAddress, '수신인 주소')}`,
    form.receiverPhone && `연락처: ${form.receiverPhone}`,
    '',
    '제목: 대여금 변제 청구의 건',
    '',
    '대여 및 미변제 사실',
    `1. 발신인은 ${koDate(form.loanDate, '차용일')} 수신인에게 금 ${money(amount, '빌려준 금액')}을(를) 대여하였습니다.`,
    `2. 위 금전 대여는 ${loanCountLabel(form.loanRecords, form.loanCount)}에 걸쳐 이루어졌습니다.`,
    recordLines.length > 0 && '구체적인 대여 내역은 다음과 같습니다.',
    ...recordLines,
    `3. 수신인은 ${koDate(form.promisedDate, '약속한 변제일')}까지 위 돈을 변제하기로 하였으나, 현재까지 약속한 변제가 이루어지지 않았습니다.`,
    form.partialPaid
      ? `4. 수신인이 일부 변제한 금액은 금 ${money(form.paidAmount, '돌려받은 금액')}이며, 현재 미변제 금액은 금 ${remaining}입니다.`
      : `4. 현재 미변제 금액은 금 ${remaining}입니다.`,
    '',
    '변제 요청',
    `발신인은 수신인에게 ${deadline} 위 미변제 금액을 변제할 것을 요청합니다.`,
    form.includeAccount && `변제 계좌는 다음과 같습니다. ${need(form.repaymentAccount, '입금 계좌')}`,
    form.hasSpecialDamage && `미변제로 인해 발생한 특별한 손해는 다음과 같습니다. ${need(form.specialDamage, '특별한 손해')}`,
    '',
    evidenceAndFollowupLines.length > 0 && '증거 및 후속 조치',
    ...evidenceAndFollowupLines,
    '',
    koDate(form.sentDate, '발송일'),
    '',
    `발신인: ${sender} (서명 또는 인)`,
  ]);
}

function paymentOrderText(form: PaymentOrderForm) {
  const creditor = need(form.creditorName, '채권자');
  const debtor = need(form.debtorName, '채무자');
  const claimAmount = form.remainingAmount.trim() ? money(form.remainingAmount, '미변제 금액') : money(form.claimAmount, '청구금액');
  const attachmentLines = [
    ...form.attachments.map((attachment, index) => `${index + 1}. ${orderAttachmentLabels[attachment]} ${form.attachmentCounts[attachment] || 1}부`),
    form.evidenceMemo.trim() && `${form.attachments.length + 1}. 기타: ${form.evidenceMemo.trim()} ${form.evidenceMemoCount || 1}부`,
  ].filter(Boolean);
  return compactLines([
    '지급명령 신청서',
    '',
    '신청인(채권자)',
    `성명: ${creditor}`,
    `주소: ${need(form.creditorAddress, '채권자 주소')}`,
    form.creditorPhone && `채권자 연락처: ${form.creditorPhone}`,
    '',
    '피신청인(채무자)',
    `성명: ${debtor}`,
    `주소: ${need(form.debtorAddress, '채무자 주소')}`,
    form.debtorPhone && `채무자 연락처: ${form.debtorPhone}`,
    '',
    '청구금액',
    `금 ${claimAmount}`,
    '',
    '청구취지',
    `피신청인은 신청인에게 금 ${claimAmount} 및 이에 대한 지연손해금을 지급하라는 지급명령을 구합니다.`,
    '',
    '청구원인',
    `1. 신청인은 ${koDate(form.loanDate, '차용일')} 피신청인에게 금 ${money(form.claimAmount, '청구금액')}을(를) 대여하였습니다.`,
    `2. 피신청인은 ${koDate(form.promisedDate, '약속한 변제일')}까지 이를 변제하기로 하였으나 현재까지 변제하지 않았습니다.`,
    form.remainingAmount && `현재 남은 미변제 금액은 금 ${money(form.remainingAmount, '미변제 금액')}입니다.`,
    form.includeInterest && `이자 또는 지연손해금 산정 근거: ${need(form.interestBasis, '이자/지연손해금 근거')}`,
    form.claimReason && `추가 사정: ${form.claimReason}`,
    '',
    '첨부서류',
    attachmentLines.length > 0 ? attachmentLines.join('\n') : '1. 차용증 또는 금전 대여 약정서 1부\n2. 계좌이체 내역 또는 현금 전달 증빙 1부',
    '',
    koDate(form.preparedDate, '준비일'),
    '',
    `신청인: ${creditor} (서명 또는 인)`,
  ]);
}

function createEvidenceFiles(files: FileList | null, kind: EvidenceKind) {
  if (!files) return [];
  return Array.from(files).map((file) => ({
    id: `${file.name}-${file.size}-${crypto.randomUUID?.() || Date.now().toString(36)}`,
    name: file.name,
    kind,
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    fileType: file.type,
  }));
}

function uniqueTerms(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => b.length - a.length);
}

function displayDateTerm(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function displayMoneyTerm(value: string) {
  const raw = value.replace(/[^\d]/g, '');
  if (!raw) return '';
  return `${Number(raw).toLocaleString('ko-KR')}원`;
}

function previewTermsForField(label: string, value: string) {
  const previewLabels = fieldExamples[label]?.previewLabels || [];
  return uniqueTerms([
    value,
    displayDateTerm(value),
    displayMoneyTerm(value),
    ...previewLabels.map((previewLabel) => exampleValues[previewLabel] || ''),
  ]);
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly = false,
  helper,
  onExampleFocus,
  onExampleBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  helper?: string;
  onExampleFocus?: (labels: string[], terms?: string[]) => void;
  onExampleBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const inputId = useId();
  const exampleFocus = useContext(ExampleFocusContext);
  const meta = fieldExamples[label];
  const fieldPlaceholder = placeholder || meta?.placeholder;
  const activateExample = (nextValue = value) => {
    setFocused(true);
    (onExampleFocus || exampleFocus?.onExampleFocus)?.(meta?.previewLabels || [], previewTermsForField(label, nextValue));
  };

  return (
    <div className="grid gap-2">
      <label htmlFor={inputId} className="text-[12px] font-extrabold text-[var(--rd-ink-2)]">{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          activateExample(event.target.value);
        }}
        onMouseDown={() => activateExample()}
        onFocus={() => activateExample()}
        onBlur={() => {
          setFocused(false);
          (onExampleBlur || exampleFocus?.onExampleBlur)?.();
        }}
        placeholder={focused ? '' : fieldPlaceholder}
        readOnly={readOnly}
        className={`min-h-11 rounded-xl border border-[var(--rd-line)] px-3 text-[14px] font-semibold outline-none focus:border-[var(--rd-blue)] ${readOnly ? 'bg-[var(--rd-blue-soft)] text-[var(--rd-blue)]' : 'bg-white'}`}
      />
      {helper && <span className="text-[12px] font-semibold leading-5 text-[var(--rd-ink-3)]">{helper}</span>}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  onExampleFocus,
  onExampleBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onExampleFocus?: (labels: string[], terms?: string[]) => void;
  onExampleBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const textareaId = useId();
  const exampleFocus = useContext(ExampleFocusContext);
  const meta = fieldExamples[label];
  const fieldPlaceholder = placeholder || meta?.placeholder;
  const activateExample = (nextValue = value) => {
    setFocused(true);
    (onExampleFocus || exampleFocus?.onExampleFocus)?.(meta?.previewLabels || [], previewTermsForField(label, nextValue));
  };

  return (
    <div className="grid gap-2">
      <label htmlFor={textareaId} className="text-[12px] font-extrabold text-[var(--rd-ink-2)]">{label}</label>
      <textarea
        id={textareaId}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          activateExample(event.target.value);
        }}
        onMouseDown={() => activateExample()}
        onFocus={() => activateExample()}
        onBlur={() => {
          setFocused(false);
          (onExampleBlur || exampleFocus?.onExampleBlur)?.();
        }}
        placeholder={focused ? '' : fieldPlaceholder}
        rows={4}
        className="rounded-xl border border-[var(--rd-line)] bg-white px-3 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-[var(--rd-blue)]"
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  previewTerms,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  previewTerms?: string[];
}) {
  const exampleFocus = useContext(ExampleFocusContext);
  const activatePreview = () => {
    exampleFocus?.onExampleFocus([], uniqueTerms(previewTerms || [label]));
  };

  return (
    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--rd-line)] bg-white px-3 text-[13px] font-extrabold text-[var(--rd-ink-2)]">
      <input
        type="checkbox"
        checked={checked}
        onMouseDown={activatePreview}
        onFocus={activatePreview}
        onChange={(event) => {
          onChange(event.target.checked);
          activatePreview();
        }}
        className="h-4 w-4 accent-[var(--rd-blue)]"
      />
      {label}
    </label>
  );
}

function RadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  previewTerms,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T; previewTerms?: string[] }>;
  onChange: (value: T) => void;
  previewTerms?: string[];
}) {
  const exampleFocus = useContext(ExampleFocusContext);

  return (
    <div className="grid gap-2">
      <div className="text-[12px] font-extrabold text-[var(--rd-ink-2)]">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-[13px] font-extrabold ${
              value === option.value ? 'border-[var(--rd-blue)] bg-[var(--rd-blue-soft)] text-[var(--rd-blue)]' : 'border-[var(--rd-line)] bg-white text-[var(--rd-ink-2)]'
            }`}
          >
            <input
              type="radio"
              checked={value === option.value}
              onMouseDown={() => exampleFocus?.onExampleFocus([], uniqueTerms([...(previewTerms || []), ...(option.previewTerms || []), option.label]))}
              onFocus={() => exampleFocus?.onExampleFocus([], uniqueTerms([...(previewTerms || []), ...(option.previewTerms || []), option.label]))}
              onChange={() => {
                onChange(option.value);
                exampleFocus?.onExampleFocus([], uniqueTerms([...(previewTerms || []), ...(option.previewTerms || []), option.label]));
              }}
              className="h-4 w-4 accent-[var(--rd-blue)]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function CheckboxGroup<T extends string>({
  label,
  values,
  options,
  onChange,
  previewTerms,
}: {
  label: string;
  values: T[];
  options: Array<{ label: string; value: T; helper?: string; previewTerms?: string[] }>;
  onChange: (values: T[]) => void;
  previewTerms?: string[];
}) {
  const exampleFocus = useContext(ExampleFocusContext);

  return (
    <div className="grid gap-2">
      <div className="text-[12px] font-extrabold text-[var(--rd-ink-2)]">{label}</div>
      <div className="grid gap-2">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-[13px] font-extrabold ${
                checked ? 'border-[var(--rd-blue)] bg-[var(--rd-blue-soft)] text-[var(--rd-blue)]' : 'border-[var(--rd-line)] bg-white text-[var(--rd-ink-2)]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onMouseDown={() => exampleFocus?.onExampleFocus([], uniqueTerms([...(previewTerms || []), ...(option.previewTerms || []), option.helper || '', option.label]))}
                onFocus={() => exampleFocus?.onExampleFocus([], uniqueTerms([...(previewTerms || []), ...(option.previewTerms || []), option.helper || '', option.label]))}
                onChange={() => {
                  onChange(toggleList(values, option.value));
                  exampleFocus?.onExampleFocus([], uniqueTerms([...(previewTerms || []), ...(option.previewTerms || []), option.helper || '', option.label]));
                }}
                className="mt-0.5 h-4 w-4 accent-[var(--rd-blue)]"
              />
              <span>
                <span className="block">{option.label}</span>
                {option.helper && <span className="mt-1 block text-[12px] font-semibold leading-5 text-[var(--rd-ink-3)]">{option.helper}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function AttachmentPicker({
  values,
  counts,
  onChange,
}: {
  values: OrderAttachment[];
  counts: Partial<Record<OrderAttachment, number>>;
  onChange: (values: OrderAttachment[], counts: Partial<Record<OrderAttachment, number>>) => void;
}) {
  const options = Object.keys(orderAttachmentLabels) as OrderAttachment[];
  const exampleFocus = useContext(ExampleFocusContext);

  const activateAttachmentPreview = (value: OrderAttachment) => {
    exampleFocus?.onExampleFocus([], uniqueTerms([orderAttachmentLabels[value], '첨부서류', '첨부']));
  };

  const toggleAttachment = (value: OrderAttachment) => {
    if (values.includes(value)) {
      const nextCounts = { ...counts };
      delete nextCounts[value];
      onChange(values.filter((item) => item !== value), nextCounts);
      return;
    }
    onChange([...values, value], { ...counts, [value]: counts[value] || 1 });
  };

  const setCount = (value: OrderAttachment, next: number) => {
    onChange(values, { ...counts, [value]: clampCount(next) });
  };

  return (
    <div className="grid gap-2">
      <div className="text-[12px] font-extrabold text-[var(--rd-ink-2)]">첨부서류를 선택하세요</div>
      <div className="grid gap-2">
        {options.map((value) => {
          const checked = values.includes(value);
          const count = counts[value] || 1;
          return (
            <div
              key={value}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-[13px] font-extrabold ${
                checked ? 'border-[var(--rd-blue)] bg-[var(--rd-blue-soft)] text-[var(--rd-blue)]' : 'border-[var(--rd-line)] bg-white text-[var(--rd-ink-2)]'
              }`}
            >
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onMouseDown={() => activateAttachmentPreview(value)}
                  onFocus={() => activateAttachmentPreview(value)}
                  onChange={() => {
                    toggleAttachment(value);
                    activateAttachmentPreview(value);
                  }}
                  className="h-4 w-4 shrink-0 accent-[var(--rd-blue)]"
                />
                <span className="min-w-0">{orderAttachmentLabels[value]}</span>
              </label>
              {checked && (
                <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-[var(--rd-line)] bg-white text-[12px] font-extrabold text-[var(--rd-ink)]">
                  <button type="button" onClick={() => setCount(value, count - 1)} className="h-8 w-8">-</button>
                  <span className="min-w-9 text-center">{count}부</span>
                  <button type="button" onClick={() => setCount(value, count + 1)} className="h-8 w-8">+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoanRecordEditor({
  label,
  records,
  onChange,
}: {
  label: string;
  records: LoanRecord[];
  onChange: (records: LoanRecord[]) => void;
}) {
  const updateRecord = (id: string, patch: Partial<LoanRecord>) => {
    onChange(records.map((record) => (record.id === id ? { ...record, ...patch } : record)));
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-extrabold text-[var(--rd-ink-2)]">{label}</div>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-[var(--rd-ink-3)]">
            여러 번 빌려줬다면 기록을 추가하세요. 문서에는 번호가 붙은 내역으로 자동 정리됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...records, createLoanRecord()])}
          className="rd-btn rd-btn-ghost min-h-9 shrink-0 px-3 text-[12px]"
        >
          <Plus size={14} />
          기록 추가
        </button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--rd-line)] bg-white p-4 text-[13px] font-semibold leading-6 text-[var(--rd-ink-3)]">
          한 번만 빌려준 경우에는 위의 총액과 날짜만으로도 문서가 작성됩니다.
        </div>
      ) : (
        <div className="grid gap-3">
          {records.map((record, index) => (
            <div key={record.id} className="grid gap-3 rounded-2xl border border-[var(--rd-line)] bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-extrabold">대여 기록 {index + 1}</div>
                <button
                  type="button"
                  onClick={() => onChange(records.filter((item) => item.id !== record.id))}
                  className="inline-flex items-center gap-1 text-[12px] font-extrabold text-[var(--rd-risk-hi)]"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="대여일" type="date" value={record.date} onChange={(value) => updateRecord(record.id, { date: value })} />
                <Field label="대여금액" value={record.amount} onChange={(value) => updateRecord(record.id, { amount: value })} placeholder="예: 1000000" />
              </div>
              <Field
                label="이 기록의 갚기로 한 날짜(선택)"
                type="date"
                value={record.dueDate}
                onChange={(value) => updateRecord(record.id, { dueDate: value })}
                helper="비워두면 위의 공통 변제기한을 사용합니다."
              />
              <Field label="메모(선택)" value={record.memo} onChange={(value) => updateRecord(record.id, { memo: value })} placeholder="예: 1차 대여, 계좌이체, 현금 전달" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceUploader({
  files,
  onAdd,
  onRemove,
}: {
  files: EvidenceFile[];
  onAdd: (files: EvidenceFile[]) => void;
  onRemove: (id: string) => void;
}) {
  const [kind, setKind] = useState<EvidenceKind>('transfer');

  return (
    <div className="grid gap-3 rounded-2xl border border-dashed border-[var(--rd-line)] bg-white p-4">
      <div>
        <div className="text-[13px] font-extrabold">증거자료 첨부</div>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-[var(--rd-ink-3)]">
          파일은 서버에 저장하지 않고, 문서의 별첨 목록과 절차 안내에만 사용됩니다.
        </p>
      </div>

      <RadioGroup<EvidenceKind>
        label="자료 종류"
        value={kind}
        onChange={setKind}
        options={(Object.keys(evidenceLabels) as EvidenceKind[]).map((value) => ({
          value,
          label: evidenceLabels[value],
        }))}
      />

      <label className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--rd-blue-soft)] px-4 text-[13px] font-extrabold text-[var(--rd-blue)]">
        사진/PDF 선택
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => {
            onAdd(createEvidenceFiles(event.target.files, kind));
            event.currentTarget.value = '';
          }}
        />
      </label>

      {files.length > 0 && (
        <div className="grid gap-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--rd-paper-2)] px-3 py-2 text-[12px] font-bold text-[var(--rd-ink-2)]">
              <span className="min-w-0 truncate">{evidenceLabels[file.kind]} · {file.name}</span>
              <button type="button" onClick={() => onRemove(file.id)} className="shrink-0 text-[var(--rd-risk-hi)]">
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormSection({ section }: { section: Section }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-paper-2)]">
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-4">
        <div>
          <h3 className="text-[18px] font-extrabold">{section.title}</h3>
          {section.required > 0 && (
            <p className="mt-1 text-[11px] font-bold text-[var(--rd-ink-3)]">
              필수 항목 {section.required}개 중 {section.done}개 완료
            </p>
          )}
        </div>
        <div className="text-[16px] font-extrabold">{section.current} / {section.total}</div>
      </div>
      <div className="grid gap-4 p-4">{section.body}</div>
    </section>
  );
}

const centeredHeadings = new Set([
  '당사자',
  '차용 내용',
  '변제 방법',
  '이자 및 지연손해금',
  '특약사항',
  '대여 및 미변제 사실',
  '변제 요청',
  '증거 및 후속 조치',
  '신청인(채권자)',
  '피신청인(채무자)',
  '청구금액',
  '청구취지',
  '청구원인',
  '첨부서류',
]);

function centeredHeadingLabel(line: string) {
  const normalized = line.replace(/^\d+\.\s*/, '').trim();
  return centeredHeadings.has(normalized) ? normalized : null;
}

function isStandaloneDateLine(line: string) {
  return /^\d{4}년\s+\d{1,2}월\s+\d{1,2}일$/.test(line.trim());
}

function isSignatureLine(line: string) {
  return /\(서명 또는 인\)$/.test(line.trim());
}

function isClosingStatement(line: string) {
  return [
    '위 내용을 확인하고 당사자는 본 차용증을 작성합니다.',
  ].includes(line.trim());
}

function renderPreviewLine(line: string, hiddenExampleTexts: Set<string>) {
  if (!previewExampleTexts.some((value) => line.includes(value))) return line;

  let remaining = line;
  const parts: React.ReactNode[] = [];
  let index = 0;

  while (remaining.length > 0) {
    const nextMatch = previewExampleTexts
      .map((value) => ({ value, position: remaining.indexOf(value) }))
      .filter((match) => match.position >= 0)
      .sort((a, b) => a.position - b.position || b.value.length - a.value.length)[0];

    if (!nextMatch) {
      parts.push(remaining);
      break;
    }

    if (nextMatch.position > 0) {
      parts.push(remaining.slice(0, nextMatch.position));
    }

    if (!hiddenExampleTexts.has(nextMatch.value)) {
      parts.push(
        <span key={`${nextMatch.value}-${index}`} className="rd-draft-example">
          {nextMatch.value}
        </span>
      );
    }

    remaining = remaining.slice(nextMatch.position + nextMatch.value.length);
    index += 1;
  }

  return parts;
}

function hasActivePreviewTerm(line: string, activePreviewTerms: string[]) {
  return activePreviewTerms.some((term) => line.includes(term));
}

function activePreviewProps(line: string, activePreviewTerms: string[]) {
  const active = hasActivePreviewTerm(line, activePreviewTerms);
  return active ? { className: 'rd-draft-active-line', 'data-active-preview-line': 'true' } : {};
}

function DocumentPreview({
  text,
  evidenceFiles,
  activeExampleLabels,
  activePreviewTerms,
}: {
  text: string;
  evidenceFiles: EvidenceFile[];
  activeExampleLabels: string[];
  activePreviewTerms: string[];
}) {
  const hiddenExampleTexts = new Set(activeExampleLabels.map((label) => exampleValues[label]).filter(Boolean));

  return (
    <article id="draft-print-area" className="rd-draft-paper">
      {text.split('\n').map((line, index) => {
        if (index === 0) {
          return <h2 key={`${line}-${index}`}>{line}</h2>;
        }
        const heading = centeredHeadingLabel(line);
        if (heading) {
          return <h3 key={`${line}-${index}`}>{heading}</h3>;
        }
        if (isStandaloneDateLine(line)) {
          const active = hasActivePreviewTerm(line, activePreviewTerms);
          return <p key={`${line}-${index}`} className={`rd-draft-date-line ${active ? 'rd-draft-active-line' : ''}`} data-active-preview-line={active ? 'true' : undefined}>{line}</p>;
        }
        if (isClosingStatement(line)) {
          return <p key={`${line}-${index}`} className="rd-draft-closing-line">{line}</p>;
        }
        if (isSignatureLine(line)) {
          const active = hasActivePreviewTerm(line, activePreviewTerms);
          return <p key={`${line}-${index}`} className={`rd-draft-sign-line ${active ? 'rd-draft-active-line' : ''}`} data-active-preview-line={active ? 'true' : undefined}>{renderPreviewLine(line, hiddenExampleTexts)}</p>;
        }
        return line ? <p key={`${line}-${index}`} {...activePreviewProps(line, activePreviewTerms)}>{renderPreviewLine(line, hiddenExampleTexts)}</p> : <br key={`blank-${index}`} />;
      })}
      {evidenceFiles.length > 0 && (
        <section className="rd-draft-attachments">
          <h3>별첨자료</h3>
          {evidenceFiles.map((file, index) => (
            <div key={file.id} className="rd-draft-attachment">
              <p className="rd-draft-attachment-title">
                별첨 {index + 1}. {evidenceLabels[file.kind]} - {file.name}
              </p>
              {file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.previewUrl} alt={`${evidenceLabels[file.kind]} 첨부자료`} />
              ) : (
                <p className="rd-draft-attachment-note">
                  PDF 또는 이미지가 아닌 파일은 현재 문서에 파일명만 표시됩니다.
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}

function findLivePreviewLine(text: string, terms: string[]) {
  if (terms.length === 0) return null;

  const lines = text.split('\n').map((line) => line.trim());
  const index = lines.findIndex((line) => line && terms.some((term) => line.includes(term)));
  if (index < 0) return null;

  const heading = [...lines.slice(0, index)].reverse().find((line) => centeredHeadingLabel(line));
  return {
    heading: heading ? centeredHeadingLabel(heading) || heading : '문서 반영 문장',
    line: lines[index],
  };
}

function MobileDraftLivePreview({ preview }: { preview: { heading: string; line: string } | null }) {
  if (!preview) return null;

  return (
    <section className="rd-draft-live-preview" aria-live="polite">
      <div className="rd-draft-live-preview-label">실시간 문서 반영</div>
      <div className="rd-draft-live-preview-heading">{preview.heading}</div>
      <p>{preview.line}</p>
    </section>
  );
}

export default function DraftPage() {
  const [draftType, setDraftType] = useState<DraftType>('loan');
  const [mobileStarted, setMobileStarted] = useState(false);
  const [loan, setLoan] = useState<LoanForm>(emptyLoan);
  const [notice, setNotice] = useState<NoticeForm>(emptyNotice);
  const [order, setOrder] = useState<PaymentOrderForm>(emptyOrder);
  const [copied, setCopied] = useState(false);
  const [manualText, setManualText] = useState<string | null>(null);
  const [activeExampleLabels, setActiveExampleLabels] = useState<string[]>([]);
  const [activePreviewTerms, setActivePreviewTerms] = useState<string[]>([]);

  const generatedText = useMemo(() => {
    if (draftType === 'loan') return loanText(loan);
    if (draftType === 'notice') return noticeText(notice);
    return paymentOrderText(order);
  }, [draftType, loan, notice, order]);
  const text = manualText ?? generatedText;
  const manualDirty = manualText !== null;
  const missing = draftType === 'loan' ? missingLoan(loan) : draftType === 'notice' ? missingNotice(notice) : missingOrder(order);
  const noticeAutoAmount = loanRecordTotal(notice.loanRecords);
  const livePreview = useMemo(() => findLivePreviewLine(text, activePreviewTerms), [text, activePreviewTerms]);
  const exampleFocusHandlers = useMemo(
    () => ({
      onExampleFocus: (labels: string[], terms: string[] = []) => {
        setActiveExampleLabels(labels);
        setActivePreviewTerms(terms);
      },
      onExampleBlur: () => {
        setActiveExampleLabels([]);
        setActivePreviewTerms([]);
      },
    }),
    []
  );

  const loanSections: Section[] = [
    {
      title: '채권자 및 채무자',
      current: 1,
      total: 4,
      done: filled([loan.creditorName, loan.debtorName]),
      required: 2,
      body: (
        <>
          <Field label="돈 빌려준 사람(채권자)" value={loan.creditorName} onChange={(value) => setLoan({ ...loan, creditorName: value })} />
          <Field label="돈 빌린 사람(채무자)" value={loan.debtorName} onChange={(value) => setLoan({ ...loan, debtorName: value })} />
          <Field label="채권자 주소" value={loan.creditorAddress} onChange={(value) => setLoan({ ...loan, creditorAddress: value })} />
          <Field label="채무자 주소" value={loan.debtorAddress} onChange={(value) => setLoan({ ...loan, debtorAddress: value })} />
          <Field label="채권자 연락처" value={loan.creditorPhone} onChange={(value) => setLoan({ ...loan, creditorPhone: value })} />
          <Field label="채무자 연락처" value={loan.debtorPhone} onChange={(value) => setLoan({ ...loan, debtorPhone: value })} />
        </>
      ),
    },
    {
      title: '금전 대여 내용',
      current: 2,
      total: 4,
      done: filled([loan.amount, loan.loanDate, loan.dueDate]),
      required: 3,
      body: (
        <>
          <Field label="차용금액" value={loan.amount} onChange={(value) => setLoan({ ...loan, amount: value })} placeholder="예: 3000000" />
          <Field label="돈을 빌려주는 날짜" type="date" value={loan.loanDate} onChange={(value) => setLoan({ ...loan, loanDate: value })} />
          <Field
            label="돈을 갚기로 한 날짜"
            type="date"
            value={loan.dueDate}
            onChange={(value) => setLoan({ ...loan, dueDate: value })}
          />
        </>
      ),
    },
    {
      title: '이자 · 지연손해금 · 계좌',
      current: 3,
      total: 4,
      done: 0,
      required: 0,
      body: (
        <>
          <Toggle label="이자를 약정했어요" checked={loan.hasInterest} onChange={(checked) => setLoan({ ...loan, hasInterest: checked })} previewTerms={['이자는 연', '별도의 이자를 약정하지 않았습니다']} />
          {loan.hasInterest && <Field label="이자율(연 %)" value={loan.interestRate} onChange={(value) => setLoan({ ...loan, interestRate: value })} placeholder="예: 5" />}
          <Toggle label="지연손해금을 정했어요" checked={loan.hasLateFee} onChange={(checked) => setLoan({ ...loan, hasLateFee: checked })} previewTerms={['지연손해금은 연', '별도의 지연손해금을 약정하지 않았습니다']} />
          {loan.hasLateFee && <Field label="지연손해금율(연 %)" value={loan.lateFeeRate} onChange={(value) => setLoan({ ...loan, lateFeeRate: value })} placeholder="예: 12" />}
          <Field label="상환계좌" value={loan.repaymentAccount} onChange={(value) => setLoan({ ...loan, repaymentAccount: value })} placeholder="은행명 계좌번호 예금주" />
        </>
      ),
    },
    {
      title: '특약 및 작성일',
      current: 4,
      total: 4,
      done: filled([loan.writtenDate]),
      required: 1,
      body: (
        <>
          <CheckboxGroup<LoanSpecialOption>
            label="문서에 넣을 특약을 선택하세요"
            values={loan.specialOptions}
            onChange={(values) => setLoan({ ...loan, specialOptions: values })}
            options={(Object.keys(loanSpecialLabels) as LoanSpecialOption[]).map((value) => ({
              value,
              label: loanSpecialLabels[value],
              helper: loanSpecialSentences[value],
            }))}
          />
          <TextArea label="기타 특약(선택)" value={loan.specialTerms} onChange={(value) => setLoan({ ...loan, specialTerms: value })} placeholder="목록에 없는 약속만 짧게 적어주세요." />
          <Field label="작성일" type="date" value={loan.writtenDate} onChange={(value) => setLoan({ ...loan, writtenDate: value })} />
        </>
      ),
    },
  ];

  const noticeSections: Section[] = [
    {
      title: '발신인 및 수신인',
      current: 1,
      total: 8,
      done: filled([notice.senderName, notice.senderAddress, notice.receiverName, notice.receiverAddress]),
      required: 4,
      body: (
        <>
          <Field label="보내는 사람(채권자)" value={notice.senderName} onChange={(value) => setNotice({ ...notice, senderName: value })} />
          <Field label="보내는 사람 주소" value={notice.senderAddress} onChange={(value) => setNotice({ ...notice, senderAddress: value })} />
          <Field label="보내는 사람 연락처" value={notice.senderPhone} onChange={(value) => setNotice({ ...notice, senderPhone: value })} />
          <Field label="받는 사람(채무자)" value={notice.receiverName} onChange={(value) => setNotice({ ...notice, receiverName: value })} />
          <Field label="받는 사람 주소" value={notice.receiverAddress} onChange={(value) => setNotice({ ...notice, receiverAddress: value })} />
          <Field label="받는 사람 연락처" value={notice.receiverPhone} onChange={(value) => setNotice({ ...notice, receiverPhone: value })} />
        </>
      ),
    },
    {
      title: '기초 질문',
      current: 2,
      total: 8,
      done: 0,
      required: 0,
      body: (
        <>
          <RadioGroup<LoanCount>
            label="돈을 몇 번에 걸쳐 빌려줬나요?"
            value={notice.loanCount}
            onChange={(value) => setNotice({ ...notice, loanCount: value })}
            previewTerms={['위 금전 대여는']}
            options={['1회', '2회', '3회', '3회 그 이상'].map((value) => ({ label: value, value: value as LoanCount }))}
          />
          <Toggle label="빌려준 돈의 일부를 돌려받았어요" checked={notice.partialPaid} onChange={(checked) => setNotice({ ...notice, partialPaid: checked })} previewTerms={['일부 변제한 금액', '현재 미변제 금액']} />
          <Toggle label="돈을 돌려받지 못해 특별한 손해가 있어요" checked={notice.hasSpecialDamage} onChange={(checked) => setNotice({ ...notice, hasSpecialDamage: checked })} previewTerms={['특별한 손해는 다음과 같습니다']} />
          <Toggle label="돌려받을 계좌 정보를 문서에 넣을게요" checked={notice.includeAccount} onChange={(checked) => setNotice({ ...notice, includeAccount: checked })} previewTerms={['변제 계좌는 다음과 같습니다']} />
        </>
      ),
    },
    {
      title: '돈을 빌려준 내용',
      current: 3,
      total: 8,
      done: filled([noticeAutoAmount > 0 ? String(noticeAutoAmount) : notice.amount, notice.loanDate, notice.promisedDate]),
      required: 3,
      body: (
        <>
          <Field
            label="빌려준 금액"
            value={noticeAutoAmount > 0 ? noticeAutoAmount.toLocaleString('ko-KR') : notice.amount}
            onChange={(value) => setNotice({ ...notice, amount: value })}
            placeholder="예: 3000000"
            readOnly={noticeAutoAmount > 0}
            helper={noticeAutoAmount > 0 ? '아래 대여 기록 금액을 합산해 자동 계산했어요.' : '기록을 추가하지 않는 경우 직접 입력하세요.'}
          />
          <Field label="돈을 빌려준 날짜" type="date" value={notice.loanDate} onChange={(value) => setNotice({ ...notice, loanDate: value })} />
          <Field
            label="공통 약속 변제일"
            type="date"
            value={notice.promisedDate}
            onChange={(value) => setNotice({ ...notice, promisedDate: value })}
            helper="대여 기록별 변제기한을 따로 넣지 않으면 이 날짜를 사용합니다."
          />
          <LoanRecordEditor
            label="구체적인 대여 기록"
            records={notice.loanRecords}
            onChange={(loanRecords) => setNotice({ ...notice, loanRecords })}
          />
        </>
      ),
    },
    {
      title: '갚지 않은 돈의 내역',
      current: 4,
      total: 8,
      done: notice.partialPaid ? filled([notice.paidAmount, notice.remainingAmount]) : 0,
      required: notice.partialPaid ? 2 : 0,
      body: (
        <>
          {notice.partialPaid ? (
            <>
              <Field label="돌려받은 금액" value={notice.paidAmount} onChange={(value) => setNotice({ ...notice, paidAmount: value })} placeholder="예: 500000" />
              <Field label="아직 못 받은 금액" value={notice.remainingAmount} onChange={(value) => setNotice({ ...notice, remainingAmount: value })} placeholder="예: 2500000" />
            </>
          ) : (
            <p className="rounded-xl bg-white p-3 text-[13px] font-semibold leading-6 text-[var(--rd-ink-2)]">
              일부 변제를 받지 않은 것으로 선택되어, 미변제 금액은 빌려준 금액 전체로 작성됩니다.
            </p>
          )}
        </>
      ),
    },
    {
      title: '수신인의 이행 사항',
      current: 5,
      total: 8,
      done: notice.repayTiming === 'deadline' ? filled([notice.requestDueDate]) : 0,
      required: notice.repayTiming === 'deadline' ? 1 : 0,
      body: (
        <>
          <RadioGroup<RepayTiming>
            label="상대에게 돈을 돌려받을 날짜를 정하시나요?"
            value={notice.repayTiming}
            onChange={(value) => setNotice({ ...notice, repayTiming: value })}
            previewTerms={['위 미변제 금액을 변제할 것을 요청합니다']}
            options={[
              { label: '즉시 갚도록 함', value: 'immediate', previewTerms: ['본 내용증명을 받은 즉시'] },
              { label: '돈 갚을 기한을 정해서 알림', value: 'deadline', previewTerms: ['까지 위 미변제 금액'] },
            ]}
          />
          {notice.repayTiming === 'deadline' && <Field label="최종 변제 요청 기한" type="date" value={notice.requestDueDate} onChange={(value) => setNotice({ ...notice, requestDueDate: value })} />}
          {notice.includeAccount && <Field label="입금 계좌" value={notice.repaymentAccount} onChange={(value) => setNotice({ ...notice, repaymentAccount: value })} placeholder="은행명 계좌번호 예금주" />}
        </>
      ),
    },
    {
      title: '특별한 손해',
      current: 6,
      total: 8,
      done: notice.hasSpecialDamage ? filled([notice.specialDamage]) : 0,
      required: notice.hasSpecialDamage ? 1 : 0,
      body: (
        notice.hasSpecialDamage ? (
          <TextArea label="특별한 손해 내용" value={notice.specialDamage} onChange={(value) => setNotice({ ...notice, specialDamage: value })} placeholder="예: 약속한 날짜에 돈을 받지 못해 계약금을 잃었음" />
        ) : (
          <p className="rounded-xl bg-white p-3 text-[13px] font-semibold leading-6 text-[var(--rd-ink-2)]">
            특별한 손해가 없는 것으로 선택되어 문서에는 별도 손해 항목을 넣지 않습니다.
          </p>
        )
      ),
    },
    {
      title: '증거자료 첨부',
      current: 7,
      total: 8,
      done: notice.evidenceFiles.length > 0 ? 1 : 0,
      required: 0,
      body: (
        <>
          <EvidenceUploader
            files={notice.evidenceFiles}
            onAdd={(files) => setNotice({ ...notice, evidenceFiles: [...notice.evidenceFiles, ...files] })}
            onRemove={(id) => setNotice({ ...notice, evidenceFiles: notice.evidenceFiles.filter((file) => file.id !== id) })}
          />
          <TextArea label="기타 증거 메모(선택)" value={notice.evidenceMemo} onChange={(value) => setNotice({ ...notice, evidenceMemo: value })} placeholder="첨부 목록에 없는 증거만 짧게 적어주세요." />
        </>
      ),
    },
    {
      title: '발송 정보 확인',
      current: 8,
      total: 8,
      done: filled([notice.sentDate]),
      required: 1,
      body: (
        <>
          <CheckboxGroup<NoticeFollowupOption>
            label="상대가 안 갚으면 다음에 검토할 절차"
            values={notice.followupOptions}
            onChange={(values) => setNotice({ ...notice, followupOptions: values })}
            options={(Object.keys(noticeFollowupLabels) as NoticeFollowupOption[]).map((value) => ({
              value,
              label: noticeFollowupLabels[value],
              helper: noticeFollowupSentences[value],
            }))}
          />
          <Field label="발송일" type="date" value={notice.sentDate} onChange={(value) => setNotice({ ...notice, sentDate: value })} />
          <p className="rounded-xl bg-white p-3 text-[13px] font-semibold leading-6 text-[var(--rd-ink-2)]">
            내용증명은 동일한 내용 3부를 준비해 우체국 또는 인터넷우체국에서 발송할 수 있습니다. 첨부한 증거자료는 원본 또는 사본을 별도로 보관하세요.
          </p>
        </>
      ),
    },
  ];

  const orderSections: Section[] = [
    {
      title: '당사자 정보',
      current: 1,
      total: 5,
      done: filled([order.creditorName, order.creditorAddress, order.debtorName, order.debtorAddress]),
      required: 4,
      body: (
        <>
          <Field label="채권자 이름" value={order.creditorName} onChange={(value) => setOrder({ ...order, creditorName: value })} />
          <Field label="채권자 주소" value={order.creditorAddress} onChange={(value) => setOrder({ ...order, creditorAddress: value })} />
          <Field label="채권자 연락처" value={order.creditorPhone} onChange={(value) => setOrder({ ...order, creditorPhone: value })} />
          <Field label="채무자 이름" value={order.debtorName} onChange={(value) => setOrder({ ...order, debtorName: value })} />
          <Field label="채무자 주소" value={order.debtorAddress} onChange={(value) => setOrder({ ...order, debtorAddress: value })} />
          <Field label="채무자 연락처" value={order.debtorPhone} onChange={(value) => setOrder({ ...order, debtorPhone: value })} />
        </>
      ),
    },
    {
      title: '청구금액과 변제기한',
      current: 2,
      total: 5,
      done: filled([order.claimAmount, order.loanDate, order.promisedDate]),
      required: 3,
      body: (
        <>
          <Field label="청구금액" value={order.claimAmount} onChange={(value) => setOrder({ ...order, claimAmount: value })} placeholder="예: 3000000" />
          <Field label="현재 남은 미변제 금액" value={order.remainingAmount} onChange={(value) => setOrder({ ...order, remainingAmount: value })} placeholder="일부 변제 후 남은 금액이 있으면 입력" />
          <Field label="돈을 빌려준 날짜" type="date" value={order.loanDate} onChange={(value) => setOrder({ ...order, loanDate: value })} />
          <Field label="약속한 변제일" type="date" value={order.promisedDate} onChange={(value) => setOrder({ ...order, promisedDate: value })} />
        </>
      ),
    },
    {
      title: '이자 · 지연손해금',
      current: 3,
      total: 5,
      done: order.includeInterest ? filled([order.interestBasis]) : 0,
      required: order.includeInterest ? 1 : 0,
      body: (
        <>
          <Toggle label="이자나 지연손해금도 청구할 예정이에요" checked={order.includeInterest} onChange={(checked) => setOrder({ ...order, includeInterest: checked })} previewTerms={['이자 또는 지연손해금 산정 근거', '지연손해금을 지급하라는 지급명령']} />
          {order.includeInterest && (
            <TextArea label="이자/지연손해금 산정 근거" value={order.interestBasis} onChange={(value) => setOrder({ ...order, interestBasis: value })} placeholder="약정 이자율, 지연손해금 약정, 청구 기간 등을 적어주세요." />
          )}
        </>
      ),
    },
    {
      title: '청구원인과 증거자료',
      current: 4,
      total: 5,
      done: order.attachments.length > 0 ? 1 : 0,
      required: 0,
      body: (
        <>
          <TextArea label="추가 청구원인 메모(선택)" value={order.claimReason} onChange={(value) => setOrder({ ...order, claimReason: value })} placeholder="목록으로 표현하기 어려운 사정만 짧게 적어주세요." />
          <AttachmentPicker
            values={order.attachments}
            counts={order.attachmentCounts}
            onChange={(attachments, attachmentCounts) => setOrder({ ...order, attachments, attachmentCounts })}
          />
          <TextArea label="기타 첨부서류(선택)" value={order.evidenceMemo} onChange={(value) => setOrder({ ...order, evidenceMemo: value })} placeholder="목록에 없는 첨부서류만 적어주세요." />
          {order.evidenceMemo.trim() && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rd-line)] bg-white px-3 py-3 text-[13px] font-extrabold text-[var(--rd-ink-2)]">
              <span>기타 첨부서류 부수</span>
              <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-[var(--rd-line)] bg-white text-[12px] font-extrabold text-[var(--rd-ink)]">
                <button type="button" onClick={() => setOrder({ ...order, evidenceMemoCount: clampCount(order.evidenceMemoCount - 1) })} className="h-8 w-8">-</button>
                <span className="min-w-9 text-center">{order.evidenceMemoCount}부</span>
                <button type="button" onClick={() => setOrder({ ...order, evidenceMemoCount: clampCount(order.evidenceMemoCount + 1) })} className="h-8 w-8">+</button>
              </div>
            </div>
          )}
        </>
      ),
    },
    {
      title: '신청서 제출 전 확인',
      current: 5,
      total: 5,
      done: filled([order.preparedDate]),
      required: 1,
      body: (
        <>
          <CheckboxGroup<OrderCheck>
            label="신청서 제출 전 확인한 항목"
            values={order.preSubmitChecks}
            onChange={(values) => setOrder({ ...order, preSubmitChecks: values })}
            options={(Object.keys(orderCheckLabels) as OrderCheck[]).map((value) => ({
              value,
              label: orderCheckLabels[value],
            }))}
          />
          <TextArea label="기타 제출 메모(선택)" value={order.courtMemo} onChange={(value) => setOrder({ ...order, courtMemo: value })} placeholder="목록에 없는 제출 관련 메모만 짧게 적어주세요." />
          <Field label="준비일" type="date" value={order.preparedDate} onChange={(value) => setOrder({ ...order, preparedDate: value })} />
          <p className="rounded-xl bg-white p-3 text-[13px] font-semibold leading-6 text-[var(--rd-ink-2)]">
            지급명령 신청서는 법원에 제출하는 문서입니다. 이 화면은 신청서 작성을 돕는 자동작성 폼이며, 실제 제출은 대한민국 법원 전자소송 또는 관할 법원에서 본인이 진행해야 합니다.
          </p>
        </>
      ),
    },
  ];

  const sections = draftType === 'loan' ? loanSections : draftType === 'notice' ? noticeSections : orderSections;
  const stepIcons: Record<DraftType, React.ElementType> = {
    loan: Banknote,
    notice: BellRing,
    order: Gavel,
  };

  function warnMissing() {
    if (missing.length === 0) return false;
    alert(`아직 입력하지 않은 항목이 있어요.\n\n${missing.join(', ')}`);
    return true;
  }

  async function copyDocument() {
    if (warnMissing()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function printDocument() {
    if (warnMissing()) return;
    window.print();
  }

  function reset() {
    setLoan(emptyLoan);
    setNotice(emptyNotice);
    setOrder(emptyOrder);
    setCopied(false);
    setManualText(null);
  }

  function selectDraftType(type: DraftType) {
    setDraftType(type);
    setManualText(null);
    setMobileStarted(true);
  }

  return (
    <AppShell>
      <ExampleFocusContext.Provider value={exampleFocusHandlers}>
        <div className={`rd-draft-workspace ${mobileStarted ? 'is-mobile-writing' : 'is-mobile-choosing'} ${livePreview ? 'has-live-preview' : ''}`}>
        <section className="rd-draft-mobile-choice">
          <div>
            <div className="rd-section-label">법률문서 작성</div>
            <h1 className="mt-1 text-[24px] font-extrabold tracking-tight">어떤 문서를 만들까요?</h1>
            <p className="mt-2 text-[13px] font-semibold leading-6 text-[var(--rd-ink-2)]">
              필요한 문서를 먼저 고르면, 다음 화면에서 입력만 차례대로 진행합니다.
            </p>
          </div>

          <div className="grid gap-3">
            {(Object.keys(draftStepInfo) as DraftType[]).map((type) => {
              const Icon = stepIcons[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectDraftType(type)}
                  className={`rd-draft-type-card ${draftType === type ? 'is-active' : ''}`}
                >
                  <span className={`rd-draft-type-icon ${type === 'notice' ? 'is-danger' : ''}`}>
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-extrabold text-[var(--rd-ink)]">{draftStepInfo[type].title}</span>
                    <span className="mt-1 block text-[13px] font-semibold leading-5 text-[var(--rd-ink-2)]">{draftStepInfo[type].desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <MobileDraftLivePreview preview={livePreview} />

        <section className="rd-draft-tools">
          <div className="rd-card rd-draft-type-panel grid gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="rd-section-label">법률문서 작성</div>
                <h1 className="mt-1 text-[22px] font-extrabold tracking-tight">문서 자동작성</h1>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={copyDocument} className="rd-btn rd-btn-ghost min-h-9 px-3 text-[12px]">
                  <Clipboard size={14} />
                  {copied ? '복사됨' : '복사'}
                </button>
                <button type="button" onClick={printDocument} className="rd-btn min-h-9 px-3 text-[12px]">
                  <FileDown size={14} />
                  PDF
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              {(Object.keys(draftStepInfo) as DraftType[]).map((type) => (
                (() => {
                  const Icon = stepIcons[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => selectDraftType(type)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${draftType === type ? 'border-[var(--rd-blue)] bg-[var(--rd-blue-soft)]' : 'border-[var(--rd-line)] bg-white hover:border-[var(--rd-blue)]'}`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${type === 'notice' ? 'text-[var(--rd-risk-hi)]' : 'text-[var(--rd-blue)]'}`}>
                        <Icon size={20} />
                      </span>
                      <span>
                        <span className="block text-[14px] font-extrabold text-[var(--rd-ink)]">{draftStepInfo[type].title}</span>
                        <span className="mt-0.5 block text-[12px] font-semibold leading-5 text-[var(--rd-ink-2)]">{draftStepInfo[type].desc}</span>
                      </span>
                    </button>
                  );
                })()
              ))}
            </div>

            <div className="grid gap-2 rounded-xl bg-[var(--rd-paper-2)] p-3 text-[12px] font-semibold leading-5 text-[var(--rd-ink-2)]">
              <div><span className="font-extrabold text-[var(--rd-ink)]">어디에: </span>{draftStepInfo[draftType].where}</div>
              <div><span className="font-extrabold text-[var(--rd-ink)]">다음: </span>{draftStepInfo[draftType].next}</div>
            </div>
          </div>

          <div className="rd-card rd-draft-mobile-current">
            <div>
              <div className="rd-section-label">선택한 문서</div>
              <div className="mt-1 text-[16px] font-extrabold text-[var(--rd-ink)]">{draftStepInfo[draftType].title}</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileStarted(false)}
              className="rd-btn rd-btn-ghost min-h-9 px-3 text-[12px]"
            >
              문서 종류 변경
            </button>
          </div>

          <div className="grid gap-4">
            <div className="rd-card flex items-center justify-between gap-3 p-4">
              <h2 className="text-[20px] font-extrabold">{draftType === 'loan' ? '차용증 입력' : draftType === 'notice' ? '내용증명 입력' : '지급명령 신청서 입력'}</h2>
              <button type="button" onClick={reset} className="rd-btn rd-btn-ghost min-h-9 px-3 text-[12px]">
                <RotateCcw size={14} />
                처음부터
              </button>
            </div>
            {sections.map((section) => <FormSection key={section.title} section={section} />)}
          </div>
        </section>

        <section className="rd-draft-preview-wrap">
          <DocumentPreview
            text={text}
            evidenceFiles={draftType === 'notice' ? notice.evidenceFiles : []}
            activeExampleLabels={activeExampleLabels}
            activePreviewTerms={activePreviewTerms}
          />
          <div className="rd-card mt-4 grid gap-3 p-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-extrabold">최종 문서 직접 수정</h2>
                <p className="mt-1 text-[12px] font-semibold leading-5 text-[var(--rd-ink-3)]">
                  선택한 항목으로 자동 작성된 본문을 마지막에만 필요한 부분만 고쳐 쓰세요.
                </p>
              </div>
              {manualDirty && (
                <button
                  type="button"
                  onClick={() => {
                    setManualText(null);
                  }}
                  className="rd-btn rd-btn-ghost min-h-9 px-3 text-[12px]"
                >
                  자동 문장으로 되돌리기
                </button>
              )}
            </div>
            <textarea
              value={text}
              onChange={(event) => {
                setManualText(event.target.value);
              }}
              rows={10}
              className="rd-draft-final-editor"
              aria-label="최종 문서 직접 수정"
            />
          </div>
        </section>

        <section className="rd-card rd-draft-notice flex gap-3 p-4 text-[13px] font-semibold leading-6 text-[var(--rd-ink-2)]">
          <AlertCircle className="mt-0.5 shrink-0 text-[var(--rd-blue)]" size={18} />
          <div>
            작성된 문서는 증거자료가 되거나 법적 효력을 가질 수 있지만, 분쟁이 크거나 복잡한 경우 전문가 상담을 권장합니다.
          </div>
        </section>
        </div>
      </ExampleFocusContext.Provider>
    </AppShell>
  );
}
