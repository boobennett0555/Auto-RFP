@tailwind base;
@tailwind components;
@tailwind utilities;

* { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
.serif { font-family: 'Fraunces', serif; }

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; display: inline-block; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.fadeIn { animation: fadeIn 0.25s ease; }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.slideUp { animation: slideUp 0.3s ease; }

[contenteditable]:empty:before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }

.prose b, .prose strong { font-weight: 600; }
.prose i, .prose em { font-style: italic; }
.prose ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
.prose ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
.prose li { margin: 0.2rem 0; }

.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
