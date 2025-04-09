import React from 'react';

const StatsCard = ({ stats }) => {
    const achievements = {
        'first_win': 'First Win',
        'first_deposit': 'First Deposit',
        'code_master': 'Code Master',
        'winning_streak': 'Winning Streak'
    };

    return (
        <div className="card p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-neon-blue">Statistics</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="stat-item">
                    <span className="text-gray-400">Total Matches</span>
                    <span className="text-2xl font-bold text-neon-purple">{stats.totalMatches}</span>
                </div>
                <div className="stat-item">
                    <span className="text-gray-400">Wins</span>
                    <span className="text-2xl font-bold text-green-500">{stats.wins}</span>
                </div>
                <div className="stat-item">
                    <span className="text-gray-400">Losses</span>
                    <span className="text-2xl font-bold text-red-500">{stats.losses}</span>
                </div>
                <div className="stat-item">
                    <span className="text-gray-400">Win Ratio</span>
                    <span className="text-2xl font-bold text-neon-blue">{stats.winRatio.toFixed(1)}%</span>
                </div>
                <div className="stat-item">
                    <span className="text-gray-400">Rank</span>
                    <span className="text-2xl font-bold text-yellow-500">{stats.rank}</span>
                </div>
                <div className="stat-item">
                    <span className="text-gray-400">Preferred Language</span>
                    <span className="text-2xl font-bold text-neon-purple capitalize">{stats.preferredLanguage}</span>
                </div>
            </div>

            {stats.achievements && stats.achievements.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-xl font-bold mb-2 text-neon-blue">Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.achievements.map((achievement, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full text-white text-sm"
                            >
                                {achievements[achievement]}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsCard; 