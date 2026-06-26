export function AliasEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="full">
      <span>Skill aliases</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"React: react.js, reactjs\nAccessibility: wcag, a11y"}
      />
      <small>One skill per line. Format: Skill: alias, another alias.</small>
    </label>
  );
}
