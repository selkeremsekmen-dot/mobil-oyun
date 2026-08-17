using UnityEngine;

namespace BuyuluKazan
{
    public static class GameBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void StartGame()
        {
            if (Object.FindObjectOfType<Match3Game>() != null) return;
            var root = new GameObject("Büyülü Kazan");
            root.AddComponent<Match3Game>();
        }
    }
}
