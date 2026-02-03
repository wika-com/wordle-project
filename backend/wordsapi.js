async function getRandomWordByLength() {
    const url = `https://random-word-api.herokuapp.com/word?length=5`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const words = await response.json();
            return words.length > 0 ? words[0] : null;
        }
        return null;
    } catch (e) {
        console.error(`Błąd: ${e}`);
        return null;
    }
}