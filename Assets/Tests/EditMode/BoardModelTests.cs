using NUnit.Framework;

namespace BuyuluKazan.Tests
{
    public sealed class BoardModelTests
    {
        [Test]
        public void NewBoard_HasNoImmediateMatches()
        {
            var board = new BoardModel(8, 8, 6, 42);
            Assert.That(board.FindMatches(), Is.Empty);
        }

        [Test]
        public void FindMatches_DetectsHorizontalAndVerticalRuns()
        {
            var board = new BoardModel(8, 8, 6, 42);
            board[0, 0] = board[1, 0] = board[2, 0] = 5;
            board[7, 2] = board[7, 3] = board[7, 4] = 4;
            Assert.That(board.FindMatches().Count, Is.GreaterThanOrEqualTo(6));
        }

        [Test]
        public void Swap_PreservesBothPieces()
        {
            var board = new BoardModel(8, 8, 6, 42);
            int first = board[0, 0];
            int second = board[1, 0];
            board.Swap(0, 0, 1, 0);
            Assert.That(board[0, 0], Is.EqualTo(second));
            Assert.That(board[1, 0], Is.EqualTo(first));
        }
    }
}
