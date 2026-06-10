import { getSession } from '@/actions/auth';
import { getPanoramaHoje } from '@/actions/hoje';
import { redirect } from 'next/navigation';
import HojeClient from './HojeClient';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export default async function HojePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Load general view by default
  const initialData = await getPanoramaHoje(undefined);
  const [usuarios] = await pool.query<RowDataPacket[]>('SELECT id, nome FROM usuarios WHERE deleted_at IS NULL ORDER BY nome ASC');

  return <HojeClient initialData={initialData} userId={session.id} usuarios={usuarios as any[]} />;
}
