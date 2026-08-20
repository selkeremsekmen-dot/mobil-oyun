using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BuyuluKazan.Editor
{
    public static class WebGLBuilder
    {
        private const string SceneDirectory = "Assets/Scenes";
        private const string ScenePath = SceneDirectory + "/Main.unity";
        private const string OutputDirectory = "WebGLBuild";

        [MenuItem("Büyülü Kazan/WebGL Sürümünü Oluştur")]
        public static void BuildFromMenu()
        {
            Build();
            EditorUtility.RevealInFinder(Path.GetFullPath(OutputDirectory));
        }

        public static void Build()
        {
            EnsureMainScene();
            ConfigurePlayer();

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = OutputDirectory,
                target = BuildTarget.WebGL,
                options = BuildOptions.CleanBuildCache
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
                throw new InvalidOperationException($"WebGL build başarısız: {report.summary.result}");

            Debug.Log($"WebGL build hazır: {Path.GetFullPath(OutputDirectory)}");
        }

        private static void EnsureMainScene()
        {
            if (!Directory.Exists(SceneDirectory)) Directory.CreateDirectory(SceneDirectory);
            if (File.Exists(ScenePath)) return;

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "Main";
            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.Refresh();
        }

        private static void ConfigurePlayer()
        {
            PlayerSettings.companyName = "Büyülü Kazan";
            PlayerSettings.productName = "Büyülü Kazan";
            PlayerSettings.defaultScreenWidth = 540;
            PlayerSettings.defaultScreenHeight = 960;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.template = "PROJECT:BuyuluKazan";
        }
    }
}
