$(function() {
  var LEADERBOARD_SIZE = 5;

  // firebase reference
  var rootRef = new Firebase("https://INSTANCE.firebaseio.com/leaderboard");
  var scoreListRef = rootRef.child("scoreList");
  var highestScoreRef = rootRef.child("highestScore");

  //preslikavanje firebase lokacija na HTML elemente da možemo premjestiti/ukloniti elemente prema potrebi
  var htmlForPath = {};

  // Pomoćna funkcija koja radi nove rezultate i dodaje odgovarajući red tabeli s najboljim rezultatima
  function handleScoreAdded(scoreSnapshot, prevScoreName) {
    var newScoreRow = $("<tr/>");
    newScoreRow.append($("<td/>").text(scoreSnapshot.val().name));
    newScoreRow.append($("<td/>").text(scoreSnapshot.val().score));

    // Pohranjivanje reference na red u tabeli kako bismo je kasnije mogli ponovno dobiti
    htmlForPath[scoreSnapshot.key()] = newScoreRow;

    // novi rezultat na odgovarajuće mjesto
    if (prevScoreName === null) {
      $("#leaderboardTable").append(newScoreRow);
    }
    else {
      var lowerScoreRow = htmlForPath[prevScoreName];
      lowerScoreRow.before(newScoreRow);
    }
  }

  // Pomoćna funkcija za uklanjanje odgovarajućeg reda u tabeli
  function handleScoreRemoved(scoreSnapshot) {
    var removedScoreRow = htmlForPath[scoreSnapshot.key()];
    removedScoreRow.remove();
    delete htmlForPath[scoreSnapshot.key()];
  }

  // posljednji LEADERBOARD_SIZE rezultati
  var scoreListView = scoreListRef.limitToLast(LEADERBOARD_SIZE);

  // obrada kada se doda novi rezultat
  scoreListView.on("child_added", function (newScoreSnapshot, prevScoreName) {
    handleScoreAdded(newScoreSnapshot, prevScoreName);
  });

  // obrada kada se rezultat ukloni
  scoreListView.on("child_removed", function (oldScoreSnapshot) {
    handleScoreRemoved(oldScoreSnapshot);
  });

  // obrada kada se rezultat promijeni ili pomaknu pozicije
  var changedCallback = function (scoreSnapshot, prevScoreName) {
    handleScoreRemoved(scoreSnapshot);
    handleScoreAdded(scoreSnapshot, prevScoreName);
  };
  scoreListView.on("child_moved", changedCallback);
  scoreListView.on("child_changed", changedCallback);

  // dodavanje rezultata i ažuriranje najvećeg rezultata
  $("#scoreInput").keypress(function (e) {
    if (e.keyCode == 13) {
      var newScore = Number($("#scoreInput").val());
      var name = $("#nameInput").val();
      $("#scoreInput").val("");

      if (name.length === 0)
        return;

      var userScoreRef = scoreListRef.child(name);

      //  setWithPriority za postavljanje ime/rezultat u Firebase i da prioritet bude rezultat
      userScoreRef.setWithPriority({ name:name, score:newScore }, newScore);

    // praćenje najvećeg rezultata 
      highestScoreRef.transaction(function (currentHighestScore) {
        if (currentHighestScore === null || newScore > currentHighestScore) {
          // Povratna vrijednost ove funkcije sprema se kao novi najviši rezultat
          return newScore;
        }
       // ako se vratimo bez argumenata, poništava se transakcija
        return;
      });
    }
  });

  // Dodavanje najvišeg rezultata u Firebaseu kako bi se ažurirala tabela
  highestScoreRef.on("value", function (newHighestScore) {
    $("#highestScoreDiv").text(newHighestScore.val());
  });
});
