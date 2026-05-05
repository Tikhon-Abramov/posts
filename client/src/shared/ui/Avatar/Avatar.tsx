import styled from 'styled-components';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
}

export function Avatar({ src, alt = 'Аватар', size = 42 }: AvatarProps) {
  return <AvatarRoot src={src || undefined} alt={alt} $size={size} />;
}

const AvatarRoot = styled.img<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  object-fit: cover;
`;
