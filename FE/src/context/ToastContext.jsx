
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react';

const ToastContext = createContext(null);

// Component hiển thị một thông báo
function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      className={`flex items-center gap-3 rounded-xl
        border bg-white p-4 shadow-lg
        ${isSuccess ? 'border-green-300' : 'border-red-300'}`}
    >
      <span className="text-2xl">
        {isSuccess ? '✅' : '❌'}
      </span>

      <div className="flex-1">
        <p className="font-semibold text-gray-900">
          {isSuccess ? 'Thành công' : 'Có lỗi xảy ra'}
        </p>

        <p className="text-sm text-gray-600">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-700"
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}

// Provider quản lý tất cả thông báo
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();

    setToasts((prev) => [
      ...prev,
      { id, message, type }
    ]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        className="fixed bottom-5 right-5 z-[9999]
          flex w-80 max-w-[calc(100vw-2rem)]
          flex-col gap-3"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook dùng trong các trang HomeFix
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast phải được sử dụng bên trong ToastProvider'
    );
  }

  return context;
}
