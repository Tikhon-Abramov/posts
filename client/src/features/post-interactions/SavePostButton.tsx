interface SavePostButtonProps {
  active?: boolean;
  onClick: () => void;
}

export function SavePostButton({ active, onClick }: SavePostButtonProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {active ? 'Сохранено' : 'Сохранить'}
    </button>
  );
}
