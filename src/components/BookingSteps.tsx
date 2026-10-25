type BookingStepsProps = {
  currentStep: 1 | 2 | 3 | 4;
};

const steps = ["Pilih Kamar", "Data Pemesan", "Pembayaran", "Selesai"];

export default function BookingSteps({
  currentStep,
}: BookingStepsProps) {
  return (
    <nav aria-label="Tahapan booking" className="mt-8">
      <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {steps.map((label, index) => {
          const number = index + 1;
          const isActive = number === currentStep;
          const isCompleted = number < currentStep;

          return (
            <li
              key={label}
              aria-current={isActive ? "step" : undefined}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                isActive
                  ? "border-[#173e35] bg-[#173e35] text-white"
                  : isCompleted
                    ? "border-[#173e35]/15 bg-[#e8efe6] text-[#173e35]"
                    : "border-[#173e35]/10 bg-white text-[#63716a]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive ? "bg-white/20" : "bg-[#173e35]/10"
                }`}
              >
                {isCompleted ? "✓" : number}
              </span>

              <span className="text-xs font-medium sm:text-sm">
                <span className="sr-only">Langkah {number}: </span>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}