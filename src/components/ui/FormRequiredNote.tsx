type FormRequiredNoteProps = {
  className?: string;
};

export default function FormRequiredNote({
  className = "",
}: FormRequiredNoteProps) {
  return (
    <p className={`text-xs text-slate-500 ${className}`.trim()}>
      <span className="font-semibold text-red-500">*</span> Star-marked fields
      are required
    </p>
  );
}
