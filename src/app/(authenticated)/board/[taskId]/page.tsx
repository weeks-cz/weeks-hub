'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to board with task param - task detail is shown in modal
    router.replace(`/board?task=${params.taskId}`);
  }, [router, params.taskId]);

  return null;
}
