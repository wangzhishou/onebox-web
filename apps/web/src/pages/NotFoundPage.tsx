import { useNavigator, useT } from '@onebox/core-react';
import { Button } from '@onebox/ui';

export function NotFoundPage() {
  const t = useT();
  const navigator = useNavigator();
  return (
    <div className="notfound">
      <h1>{t('notFound.title')}</h1>
      <Button variant="secondary" onClick={() => navigator.navigate('/')}>
        {t('notFound.backHome')}
      </Button>
    </div>
  );
}
