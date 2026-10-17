import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../utils/validation';
import { AdminDataError } from '../utils/adminAnalytics';

export default function useAdminResource(fetcher, params = {}) {
  const key = JSON.stringify(params);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const reload = useCallback(() => setRevision((prev) => prev + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    // Reset khi bắt đầu request mới để không giữ dữ liệu của bộ lọc cũ.
    // oxlint-disable-next-line react/set-state-in-effect
    setState({ data: null, loading: true, error: '' });
    fetcher(JSON.parse(key), { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            loading: false,
            error: error instanceof AdminDataError ? error.message :
              error.response?.status === 404
                ? 'Chức năng quản trị chưa sẵn sàng trên máy chủ. Vui lòng thử lại sau.'
                : apiError(error),
          });
      });
    return () => controller.abort();
  }, [fetcher, key, revision]);
  return { ...state, reload };
}
