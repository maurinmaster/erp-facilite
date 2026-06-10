import { getSession } from '@/actions/auth';
import { getPanoramaHoje } from '@/actions/hoje';
import { redirect } from 'next/navigation';
import HojeClient from './HojeClient';

export const dynamic = 'force-dynamic';

export default async function HojePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Load general view by default
  const initialData = await getPanoramaHoje(undefined);

  return <HojeClient initialData={initialData} userId={session.id} />;
}
