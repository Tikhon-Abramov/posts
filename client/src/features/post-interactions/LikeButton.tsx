interface LikeButtonProps {
  active?: boolean;
  count: number;
  onClick: () => void;
}

export function LikeButton({ active, count, onClick }: LikeButtonProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}>
      Лайк {count}
    </button>
  );
}
