import React, { useState, useEffect } from 'react';
import CodeEditorWindow from './CodeEditorWindow';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { socket } from '../../services/socket';
import CompetitionResults from './CompetitionResults';
import Matchmaking from './Matchmaking';
import OutputWindow from './OutputWindow';
import OutputDetails from './OutputDetails';
import { languageOptions } from '../../constants/languageOptions';
import { defineTheme } from '../../lib/defineTheme';
import useKeyPress from '../../hooks/useKeyPress';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Timer from './Timer';
import { theme as appTheme } from '../../styles/theme';
import { useNavigate } from 'react-router-dom';

const javascriptDefault = `// Write your code here\n\nfunction solve(input) {\n  // Your solution here\n  return input;\n}\n`;

const Competition = () => {
  const { user } = useAuth();
  const { balance, updateBalance } = useWallet();
  const [isMatching, setIsMatching] = useState(true);
  const [competitionData, setCompetitionData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [code, setCode] = useState(javascriptDefault);
  const [outputDetails, setOutputDetails] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [language, setLanguage] = useState(languageOptions[0]);
  const [startTime, setStartTime] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [challenge, setChallenge] = useState(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchData, setRematchData] = useState(null);
  const [waitingForRematch, setWaitingForRematch] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [matchWinner, setMatchWinner] = useState(null);

  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");

  const navigate = useNavigate();

  useEffect(() => {
    if (enterPress && ctrlPress) {
      console.log('Ctrl + Enter pressed');
      handleSubmit();
    }
  }, [ctrlPress, enterPress]);

  useEffect(() => {
    const handleMatchStart = async (data) => {
      console.log('Match started:', data);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/competition/challenge/${data.matchId}`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch challenge');
        }

        const challengeData = await response.json();
        console.log('Challenge data:', challengeData);
        setChallenge(challengeData);
        setCode(languageOptions[0].defaultTemplate);
        setCompetitionData(data);
        setIsMatching(false);
        setStartTime(Date.now());
      } catch (error) {
        console.error('Error fetching challenge:', error);
        showErrorToast("Error loading challenge");
        setIsMatching(true); // Reset to matchmaking state
      }
    };

    const handleMatchError = (error) => {
      console.error('Match error:', error);
      showErrorToast(error.message || "Error creating match");
      setIsMatching(true); // Reset to matchmaking state
    };

    const handleOpponentResults = (allResults) => {
      console.log('Received results:', allResults);
      
      // Ensure we have unique results for each player
      const uniqueResults = allResults.reduce((acc, result) => {
          // Use player ID as key to prevent duplicates
          acc[result.playerId] = {
              ...result,
              isCurrentUser: result.playerId === user.id
          };
          return acc;
      }, {});
      
      setResults(Object.values(uniqueResults));
      setShowResults(true);
    };

    const handleRematchRequested = (data) => {
      setRematchRequested(true);
      setRematchData(data);
    };

    const handleRematchDeclined = () => {
      setWaitingForRematch(false);
      showErrorToast("Opponent declined rematch");
    };

    socket.on('matchStart', handleMatchStart);
    socket.on('matchError', handleMatchError);
    socket.on('opponentResults', handleOpponentResults);
    socket.on('rematchRequested', handleRematchRequested);
    socket.on('rematchDeclined', handleRematchDeclined);

    return () => {
      socket.off('matchStart', handleMatchStart);
      socket.off('matchError', handleMatchError);
      socket.off('opponentResults');
      socket.off('rematchRequested', handleRematchRequested);
      socket.off('rematchDeclined', handleRematchDeclined);
    };
  }, [user.token]);

  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden) {
            setTabSwitches(prev => prev + 1);
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!socket || !competitionData?.matchId) return;

    // Join the competition room
    console.log('Joining competition room:', competitionData.matchId);
    socket.emit('joinCompetition', { 
        competitionId: competitionData.matchId,
        userId: user.id 
    });

    // Listen for competition completion
    socket.on('competitionComplete', (data) => {
        console.log('Competition complete received:', data);
        if (data.competitionId === competitionData.matchId) {
            const mappedResults = data.players.map(player => ({
                ...player,
                isCurrentUser: player.playerId === user._id
            }));
            
            console.log('Setting results:', {
                results: mappedResults,
                winner: data.winner,
                currentUserId: user._id
            });
            
            setResults(mappedResults);
            setMatchWinner(data.winner);
            setMatchComplete(true);
            setShowResults(true);
            setWaitingForOpponent(false);

            // Update the wallet balance if needed
            if (data.prize > 0) {
                updateBalance();
            }
        }
    });

    // Listen for individual submissions
    socket.on('submissionUpdate', (data) => {
        console.log('Submission update received:', data);
        if (data.competitionId === competitionData.matchId && data.playerId !== user.id) {
            setResults(prev => [
                ...prev,
                { 
                    ...data, 
                    isCurrentUser: false,
                    username: data.username || 'Opponent'
                }
            ]);
        }
    });

    return () => {
        console.log('Leaving competition room:', competitionData.matchId);
        socket.emit('leaveCompetition', { competitionId: competitionData.matchId });
        socket.off('competitionComplete');
        socket.off('submissionUpdate');
    };
  }, [socket, competitionData?.matchId, user.id, updateBalance]);

  const handleSubmit = async () => {
    if (!code.trim()) {
        showErrorToast("Please write some code!");
        return;
    }

    setProcessing(true);
    const codingTime = Math.round((Date.now() - startTime) / 1000);

    try {
        console.log('Submitting solution...');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/competition/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                code,
                language: language.id,
                competitionId: competitionData.matchId,
                codingTime,
                tabSwitches
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit code');
        }

        const data = await response.json();
        console.log('Submission response:', data);
        
        setOutputDetails(data);
        setWaitingForOpponent(true);
        showSuccessToast("Solution submitted! Waiting for opponent...");

    } catch (error) {
        console.error('Error submitting code:', error);
        showErrorToast(error.message || "Error submitting code");
        setWaitingForOpponent(false);
    } finally {
        setProcessing(false);
    }
  };

  const handleRun = async () => {
    if (!code.trim()) {
        showErrorToast("Please write some code!");
        return;
    }

    setProcessing(true);

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/competition/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                code,
                language: language.id
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to run code');
        }

        setOutputDetails(data);
        
    } catch (error) {
        console.error('Error running code:', error);
        showErrorToast(error.message || "Error running code");
    } finally {
        setProcessing(false);
    }
  };

  const showSuccessToast = (msg) => {
    toast.success(msg);
  };

  const showErrorToast = (msg) => {
    toast.error(msg);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(newLanguage.defaultTemplate);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        theme="dark"
      />
      
      {isMatching ? (
        <Matchmaking onMatchFound={(data) => {
          console.log('Match found, data:', data);
          setCompetitionData(data);
          setIsMatching(false);
          setStartTime(Date.now());
        }} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-400">
              Coding Competition
            </h2>
            <Timer 
                initialTime={timeLeft} 
                onTimeUp={() => {
                    handleSubmit();
                    showErrorToast("Time's up!");
                }} 
            />
            <div className="text-lg text-blue-400">
              Balance: {balance} MC
            </div>
          </div>

          {challenge && (
            <div className="bg-[#1f2937] rounded-lg p-6 mb-6 border border-[#374151]">
              <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
              <p className="text-gray-300 whitespace-pre-wrap mb-4">{challenge.description}</p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="text-white font-bold mb-2">Sample Test Cases:</h4>
                {challenge.testCases.map((testCase, index) => (
                  !testCase.isHidden && (
                    <div key={index} className="mb-4">
                      <p className="text-gray-400">Input: <span className="text-white">{testCase.input}</span></p>
                      <p className="text-gray-400">Expected Output: <span className="text-white">{testCase.expectedOutput}</span></p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="bg-[#1f2937] rounded-lg overflow-hidden border border-[#374151]">
                <div className="p-4 border-b border-gray-700">
                  <select
                    value={language.value}
                    onChange={(e) => {
                      const newLang = languageOptions.find(l => l.value === e.target.value);
                      handleLanguageChange(newLang);
                    }}
                    className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <CodeEditorWindow
                  code={code}
                  onChange={(value) => setCode(value)}
                  language={language.value}
                  theme={editorTheme}
                />
              </div>
            </div>

            <div className="space-y-4">
              <OutputWindow outputDetails={outputDetails} />
              {outputDetails && <OutputDetails outputDetails={outputDetails} />}
              
              <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handleRun}
                    disabled={processing}
                    className={`py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 
                        ${processing 
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-neon-cyan to-neon-blue hover:shadow-neon-cyan'
                        }`}
                >
                    Run Code
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={processing || waitingForOpponent}
                    className={`py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 
                        ${(processing || waitingForOpponent)
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-neon-purple to-neon-pink hover:shadow-neon-purple'
                        }`}
                >
                    {waitingForOpponent 
                        ? "Waiting for opponent..." 
                        : "Submit Solution"}
                </button>
              </div>
            </div>
          </div>

          {showResults && (
            <CompetitionResults 
                results={results}
                competitionData={{
                    matchId: competitionData.matchId,
                    currentUserId: user.id,
                    entryFee: competitionData.entryFee,
                    winner: matchWinner,
                    isComplete: matchComplete
                  }}
                  onClose={() => {
                      setShowResults(false);
                      navigate('/', { state: { reload: true } });
                      window.location.reload();
                  }}
              />
            )}
        </div>
      )}
    </div>
  );
};

export default Competition; 