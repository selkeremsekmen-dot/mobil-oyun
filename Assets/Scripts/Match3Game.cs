using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BuyuluKazan
{
    public sealed class Match3Game : MonoBehaviour
    {
        private const int Size = 8;
        private const int ColorCount = 6;
        private const float CellSize = 1f;
        private readonly Color[] colors =
        {
            new Color(0.95f, 0.25f, 0.32f), new Color(0.20f, 0.60f, 1f),
            new Color(0.25f, 0.85f, 0.38f), new Color(1f, 0.78f, 0.18f),
            new Color(0.67f, 0.31f, 0.92f), new Color(1f, 0.45f, 0.13f)
        };

        private BoardModel board;
        private SpriteRenderer[,] views;
        private Sprite pieceSprite;
        private Camera gameCamera;
        private Vector2Int? selected;
        private Vector2 pointerStart;
        private bool resolving;
        private bool gameOver;
        private int moves;
        private int collected;
        private int targetColor;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            SetupCamera();
            pieceSprite = CreateRoundedSprite();
            StartLevel();
        }

        private void StartLevel()
        {
            foreach (Transform child in transform) Destroy(child.gameObject);
            board = new BoardModel(Size, Size, ColorCount);
            if (!board.HasPossibleMove()) board.Shuffle();
            views = new SpriteRenderer[Size, Size];
            moves = 25;
            collected = 0;
            targetColor = Random.Range(0, ColorCount);
            selected = null;
            resolving = false;
            gameOver = false;
            BuildBoard();
        }

        private void SetupCamera()
        {
            gameCamera = Camera.main;
            if (gameCamera == null)
            {
                var cameraObject = new GameObject("Main Camera");
                gameCamera = cameraObject.AddComponent<Camera>();
                cameraObject.tag = "MainCamera";
            }
            gameCamera.orthographic = true;
            gameCamera.orthographicSize = 6.2f;
            gameCamera.transform.position = new Vector3(0, 0.6f, -10);
            gameCamera.backgroundColor = new Color(0.08f, 0.055f, 0.14f);
        }

        private void BuildBoard()
        {
            for (int y = 0; y < Size; y++)
            for (int x = 0; x < Size; x++)
            {
                var piece = new GameObject($"Malzeme {x},{y}");
                piece.transform.SetParent(transform);
                piece.transform.position = CellPosition(x, y);
                piece.transform.localScale = Vector3.one * 0.88f;
                var renderer = piece.AddComponent<SpriteRenderer>();
                renderer.sprite = pieceSprite;
                renderer.sortingOrder = 1;
                views[x, y] = renderer;
            }
            RefreshViews();
        }

        private void Update()
        {
            if (resolving || gameOver) return;
            if (TryPointerDown(out Vector2 down))
            {
                pointerStart = down;
                selected = WorldToCell(down);
                RefreshViews();
            }
            if (selected.HasValue && TryPointerUp(out Vector2 up))
            {
                Vector2 delta = up - pointerStart;
                Vector2Int from = selected.Value;
                Vector2Int direction = Mathf.Abs(delta.x) > Mathf.Abs(delta.y)
                    ? new Vector2Int(delta.x >= 0 ? 1 : -1, 0)
                    : new Vector2Int(0, delta.y >= 0 ? 1 : -1);
                Vector2Int to = from + direction;
                selected = null;
                if (delta.magnitude > 0.2f && IsInside(to)) StartCoroutine(TryMove(from, to));
                else RefreshViews();
            }
        }

        private IEnumerator TryMove(Vector2Int from, Vector2Int to)
        {
            resolving = true;
            board.Swap(from.x, from.y, to.x, to.y);
            RefreshViews();
            yield return AnimateSwap(from, to, 0.18f);
            HashSet<int> matches = board.FindMatches();
            if (matches.Count == 0)
            {
                board.Swap(from.x, from.y, to.x, to.y);
                RefreshViews();
                yield return AnimateSwap(from, to, 0.14f);
                resolving = false;
                yield break;
            }

            moves--;
            while (matches.Count > 0)
            {
                foreach (int index in matches)
                {
                    board.FromIndex(index, out int x, out int y);
                    SpawnExplosion(CellPosition(x, y), board[x, y]);
                }
                Dictionary<int, int> cleared = board.ClearMatches(matches);
                if (cleared.TryGetValue(targetColor, out int amount)) collected += amount;
                RefreshViews();
                yield return new WaitForSeconds(0.24f);
                board.CollapseAndRefill();
                RefreshViews();
                yield return new WaitForSeconds(0.16f);
                matches = board.FindMatches();
            }

            if (collected >= 20) gameOver = true;
            else if (moves <= 0) gameOver = true;
            else if (!board.HasPossibleMove()) { board.Shuffle(); RefreshViews(); }
            resolving = false;
        }

        private IEnumerator AnimateSwap(Vector2Int from, Vector2Int to, float duration)
        {
            Vector3 fromPosition = CellPosition(from.x, from.y);
            Vector3 toPosition = CellPosition(to.x, to.y);
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float linear = Mathf.Clamp01(elapsed / duration);
                float eased = linear * linear * (3f - 2f * linear);
                views[from.x, from.y].transform.position = Vector3.Lerp(fromPosition, toPosition, eased);
                views[to.x, to.y].transform.position = Vector3.Lerp(toPosition, fromPosition, eased);
                yield return null;
            }
            views[from.x, from.y].transform.position = fromPosition;
            views[to.x, to.y].transform.position = toPosition;
        }

        private void SpawnExplosion(Vector3 position, int colorIndex)
        {
            var effectObject = new GameObject("Malzeme Patlaması");
            effectObject.transform.position = position;
            var particleSystem = effectObject.AddComponent<ParticleSystem>();
            var main = particleSystem.main;
            main.duration = 0.45f;
            main.loop = false;
            main.startLifetime = new ParticleSystem.MinMaxCurve(0.24f, 0.48f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(1.4f, 3.2f);
            main.startSize = new ParticleSystem.MinMaxCurve(0.06f, 0.14f);
            main.startColor = colors[colorIndex];
            main.maxParticles = 24;
            var emission = particleSystem.emission;
            emission.rateOverTime = 0f;
            emission.SetBursts(new[] { new ParticleSystem.Burst(0f, 16) });
            var shape = particleSystem.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.08f;
            var particleRenderer = effectObject.GetComponent<ParticleSystemRenderer>();
            particleRenderer.material = new Material(Shader.Find("Sprites/Default"));
            Destroy(effectObject, 1.2f);
        }

        private void RefreshViews()
        {
            if (views == null) return;
            for (int y = 0; y < Size; y++)
            for (int x = 0; x < Size; x++)
            {
                int value = board[x, y];
                views[x, y].enabled = value >= 0;
                if (value >= 0) views[x, y].color = colors[value];
                bool isSelected = selected.HasValue && selected.Value.x == x && selected.Value.y == y;
                views[x, y].transform.localScale = Vector3.one * (isSelected ? 1.02f : 0.88f);
            }
        }

        private void OnGUI()
        {
            var title = new GUIStyle(GUI.skin.label) { fontSize = 28, alignment = TextAnchor.MiddleCenter, fontStyle = FontStyle.Bold };
            title.normal.textColor = Color.white;
            GUI.Label(new Rect(0, 12, Screen.width, 45), "BÜYÜLÜ KAZAN", title);

            var info = new GUIStyle(title) { fontSize = 20 };
            GUI.Label(new Rect(0, 55, Screen.width, 34), $"Hamle: {moves}     Hedef: {collected}/20", info);
            Color old = GUI.color;
            GUI.color = colors[targetColor];
            GUI.DrawTexture(new Rect(Screen.width / 2f + 125, 61, 22, 22), Texture2D.whiteTexture);
            GUI.color = old;

            if (!gameOver) return;
            GUI.Box(new Rect(Screen.width / 2f - 170, Screen.height / 2f - 80, 340, 160), "");
            GUI.Label(new Rect(Screen.width / 2f - 160, Screen.height / 2f - 60, 320, 55), collected >= 20 ? "İKSİR HAZIR!" : "HAMLELER BİTTİ", title);
            if (GUI.Button(new Rect(Screen.width / 2f - 90, Screen.height / 2f + 15, 180, 45), "Yeniden Oyna")) StartLevel();
        }

        private Vector3 CellPosition(int x, int y) => new Vector3((x - 3.5f) * CellSize, (y - 3.9f) * CellSize, 0);
        private bool IsInside(Vector2Int cell) => cell.x >= 0 && cell.x < Size && cell.y >= 0 && cell.y < Size;

        private Vector2Int? WorldToCell(Vector2 world)
        {
            int x = Mathf.RoundToInt(world.x / CellSize + 3.5f);
            int y = Mathf.RoundToInt(world.y / CellSize + 3.9f);
            var cell = new Vector2Int(x, y);
            return IsInside(cell) ? cell : null;
        }

        private bool TryPointerDown(out Vector2 world)
        {
            world = default;
            if (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began)
            { world = gameCamera.ScreenToWorldPoint(Input.GetTouch(0).position); return true; }
            if (Input.GetMouseButtonDown(0))
            { world = gameCamera.ScreenToWorldPoint(Input.mousePosition); return true; }
            return false;
        }

        private bool TryPointerUp(out Vector2 world)
        {
            world = default;
            if (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Ended)
            { world = gameCamera.ScreenToWorldPoint(Input.GetTouch(0).position); return true; }
            if (Input.GetMouseButtonUp(0))
            { world = gameCamera.ScreenToWorldPoint(Input.mousePosition); return true; }
            return false;
        }

        private static Sprite CreateRoundedSprite()
        {
            const int size = 64;
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false) { filterMode = FilterMode.Bilinear };
            var pixels = new Color[size * size];
            Vector2 center = Vector2.one * (size - 1) * 0.5f;
            for (int y = 0; y < size; y++)
            for (int x = 0; x < size; x++)
            {
                float distance = Vector2.Distance(new Vector2(x, y), center);
                float alpha = Mathf.SmoothStep(1f, 0f, (distance - 26f) / 5f);
                float shine = Mathf.Clamp01(1f - Vector2.Distance(new Vector2(x, y), new Vector2(23, 42)) / 15f) * 0.3f;
                pixels[y * size + x] = new Color(1f, 1f, 1f, alpha * (0.75f + shine));
            }
            texture.SetPixels(pixels);
            texture.Apply();
            return Sprite.Create(texture, new Rect(0, 0, size, size), Vector2.one * 0.5f, size);
        }
    }
}
