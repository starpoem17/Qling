import { QlingSuccessDialog } from '../shared/ui';
import type { WriteReplySuccessScreenProps } from './contract';

export function WriteReplySuccessScreen(props: WriteReplySuccessScreenProps) {
  return (
    <QlingSuccessDialog
      title="답변 전송이 완료되었어요 !"
      description="따뜻한 의견을 공유해주셔서 감사해요"
      accessibilityLabel="답변 전송 완료 확인"
      onConfirm={props.onConfirm}
    />
  );
}
