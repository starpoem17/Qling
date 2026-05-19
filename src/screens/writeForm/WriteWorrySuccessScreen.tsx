import { QlingSuccessDialog } from '../shared/ui';
import type { WriteWorrySuccessScreenProps } from './contract';

export function WriteWorrySuccessScreen(props: WriteWorrySuccessScreenProps) {
  return (
    <QlingSuccessDialog
      title="고민 전송이 완료되었어요 !"
      description="답변이 오면 알려드릴게요"
      accessibilityLabel="고민 전송 완료 확인"
      onConfirm={props.onConfirm}
    />
  );
}
