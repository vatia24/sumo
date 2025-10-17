import React from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
	id: number;
	message: string;
	type: ToastType;
	lifeMs?: number;
}

interface ToastContextType {
	addToast: (message: string, type?: ToastType, lifeMs?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
	const ctx = React.useContext(ToastContext);
	return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [toasts, setToasts] = React.useState<Toast[]>([]);
	const idRef = React.useRef(0);

	const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

	const addToast = (message: string, type: ToastType = 'info', lifeMs: number = 3000) => {
		const id = ++idRef.current;
		setToasts((prev) => [...prev, { id, message, type, lifeMs }]);
		window.setTimeout(() => remove(id), lifeMs);
	};

	return (
		<ToastContext.Provider value={{ addToast }}>
			{children}
			<div className="fixed inset-x-0 top-2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
				{toasts.map((t) => (
					<div
						key={t.id}
						role="status"
						aria-live="polite"
						className={`pointer-events-auto max-w-[90vw] sm:max-w-md w-max px-4 py-2 rounded-lg shadow-md text-sm text-white ${
							t.type === 'success'
								? 'bg-green-600'
							: t.type === 'error'
								? 'bg-red-600'
								: 'bg-gray-800'
						}`}
					>
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
};


