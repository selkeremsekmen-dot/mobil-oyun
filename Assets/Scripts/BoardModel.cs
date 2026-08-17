using System;
using System.Collections.Generic;

namespace BuyuluKazan
{
    public sealed class BoardModel
    {
        private readonly Random random;
        private readonly int colorCount;
        private readonly int[,] cells;

        public int Width { get; }
        public int Height { get; }

        public BoardModel(int width, int height, int colorCount, int seed = -1)
        {
            if (width < 3 || height < 3) throw new ArgumentOutOfRangeException(nameof(width));
            if (colorCount < 3) throw new ArgumentOutOfRangeException(nameof(colorCount));

            Width = width;
            Height = height;
            this.colorCount = colorCount;
            cells = new int[width, height];
            random = seed < 0 ? new Random() : new Random(seed);
            FillWithoutMatches();
        }

        public int this[int x, int y]
        {
            get => cells[x, y];
            set => cells[x, y] = value;
        }

        public bool AreAdjacent(int ax, int ay, int bx, int by) => Math.Abs(ax - bx) + Math.Abs(ay - by) == 1;

        public void Swap(int ax, int ay, int bx, int by)
        {
            int temp = cells[ax, ay];
            cells[ax, ay] = cells[bx, by];
            cells[bx, by] = temp;
        }

        public HashSet<int> FindMatches()
        {
            var result = new HashSet<int>();
            for (int y = 0; y < Height; y++)
            {
                int runStart = 0;
                for (int x = 1; x <= Width; x++)
                {
                    if (x < Width && cells[x, y] >= 0 && cells[x, y] == cells[runStart, y]) continue;
                    if (cells[runStart, y] >= 0 && x - runStart >= 3)
                        for (int i = runStart; i < x; i++) result.Add(ToIndex(i, y));
                    runStart = x;
                }
            }

            for (int x = 0; x < Width; x++)
            {
                int runStart = 0;
                for (int y = 1; y <= Height; y++)
                {
                    if (y < Height && cells[x, y] >= 0 && cells[x, y] == cells[x, runStart]) continue;
                    if (cells[x, runStart] >= 0 && y - runStart >= 3)
                        for (int i = runStart; i < y; i++) result.Add(ToIndex(x, i));
                    runStart = y;
                }
            }
            return result;
        }

        public Dictionary<int, int> ClearMatches(HashSet<int> matches)
        {
            var cleared = new Dictionary<int, int>();
            foreach (int index in matches)
            {
                FromIndex(index, out int x, out int y);
                int color = cells[x, y];
                if (color < 0) continue;
                cleared[color] = cleared.TryGetValue(color, out int amount) ? amount + 1 : 1;
                cells[x, y] = -1;
            }
            return cleared;
        }

        public void CollapseAndRefill()
        {
            for (int x = 0; x < Width; x++)
            {
                int destination = 0;
                for (int y = 0; y < Height; y++)
                    if (cells[x, y] >= 0) cells[x, destination++] = cells[x, y];
                while (destination < Height) cells[x, destination++] = random.Next(colorCount);
            }
        }

        public bool HasPossibleMove()
        {
            for (int y = 0; y < Height; y++)
            for (int x = 0; x < Width; x++)
            {
                if (x + 1 < Width && SwapCreatesMatch(x, y, x + 1, y)) return true;
                if (y + 1 < Height && SwapCreatesMatch(x, y, x, y + 1)) return true;
            }
            return false;
        }

        public void Shuffle()
        {
            do FillWithoutMatches(); while (!HasPossibleMove());
        }

        private bool SwapCreatesMatch(int ax, int ay, int bx, int by)
        {
            Swap(ax, ay, bx, by);
            bool creates = FindMatches().Count > 0;
            Swap(ax, ay, bx, by);
            return creates;
        }

        private void FillWithoutMatches()
        {
            for (int y = 0; y < Height; y++)
            for (int x = 0; x < Width; x++)
            {
                int candidate;
                do candidate = random.Next(colorCount);
                while ((x >= 2 && cells[x - 1, y] == candidate && cells[x - 2, y] == candidate) ||
                       (y >= 2 && cells[x, y - 1] == candidate && cells[x, y - 2] == candidate));
                cells[x, y] = candidate;
            }
        }

        public int ToIndex(int x, int y) => y * Width + x;
        public void FromIndex(int index, out int x, out int y) { x = index % Width; y = index / Width; }
    }
}
