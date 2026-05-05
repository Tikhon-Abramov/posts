interface DislikeButtonProps {
  active?: boolean;
  count: number;
  onClick: () => void;
}

export function DislikeButton({ active, count, onClick }: DislikeButtonProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}>
      Дизлайк {count}
    </button>
  );
}
