import styled from 'styled-components';
import type { Post } from '../model/postTypes';
import { PostCard } from './PostCard';

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  return (
    <Grid>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  gap: 18px;
`;
