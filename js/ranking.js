(() => {
  const STORAGE_KEY = "hyrule-memory-ranking-v1";
  const LEGACY_PRESET_IDS = new Set(["zelda-42", "link-51", "impa-63"]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const normalizeEntry = (entry) => {
    const name = String(entry?.name || "")
      .trim()
      .slice(0, 24);
    const seconds = Number(entry?.seconds);

    if (!name || !Number.isFinite(seconds) || seconds < 0) {
      return null;
    }

    return {
      id: String(entry.id || `${name}-${seconds}`),
      name,
      seconds: Math.floor(seconds),
    };
  };

  const sortRanking = (entries) =>
    entries
      .map(normalizeEntry)
      .filter(Boolean)
      .sort((first, second) => first.seconds - second.seconds)
      .slice(0, 5);

  const saveRanking = (entries) => {
    const ranking = sortRanking(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ranking));
    return ranking;
  };

  const getRanking = () => {
    try {
      const savedRanking = JSON.parse(localStorage.getItem(STORAGE_KEY));

      if (Array.isArray(savedRanking)) {
        const realScores = savedRanking.filter(
          (entry) => !LEGACY_PRESET_IDS.has(String(entry?.id || "")),
        );
        return saveRanking(realScores);
      }
    } catch {
      // A lista inicial é usada quando não há dados válidos salvos.
    }

    return saveRanking([]);
  };

  const recordScore = (name, seconds) => {
    const entry = normalizeEntry({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      seconds,
    });

    const ranking = saveRanking([...getRanking(), entry]);
    return {
      ranking,
      position: ranking.findIndex((item) => item.id === entry.id) + 1,
    };
  };

  window.HyruleRanking = { formatTime, getRanking, recordScore };
})();
