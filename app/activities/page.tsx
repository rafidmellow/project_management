import { redirect } from 'next/navigation';

export default function ActivitiesPage() {
  // Redirect to dashboard or another appropriate page
  redirect('/dashboard');
  return null;
}
