import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const TIERS = [
    { name: 'Bronze', min: 0, max: 4, icon: Star, color: 'from-amber-700 to-amber-900', bonus: 0 },
    { name: 'Prata', min: 5, max: 9, icon: Star, color: 'from-gray-400 to-gray-600', bonus: 1 },
    { name: 'Ouro', min: 10, max: 19, icon: Trophy, color: 'from-yellow-400 to-yellow-600', bonus: 2 },
    { name: 'Platina', min: 20, max: 49, icon: Trophy, color: 'from-cyan-400 to-cyan-600', bonus: 3 },
    { name: 'Diamante', min: 50, max: Infinity, icon: Crown, color: 'from-purple-400 to-purple-600', bonus: 5 }
];

export default function ReferralProgress({ totalValid }) {
    const currentTier = TIERS.find(t => totalValid >= t.min && totalValid <= t.max) || TIERS[0];
    const currentTierIndex = TIERS.indexOf(currentTier);
    const nextTier = TIERS[currentTierIndex + 1];
    
    const progressInCurrentTier = nextTier 
        ? ((totalValid - currentTier.min) / (nextTier.min - currentTier.min)) * 100
        : 100;
    
    const Icon = currentTier.icon;

    return (
        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-violet-600" />
                    Seu Nível de Indicador
                </CardTitle>
                <CardDescription>
                    Quanto mais indicações, maior seu bônus por indicação
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Tier Atual */}
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${currentTier.color} shadow-xl mb-3`}
                    >
                        <Icon className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900">{currentTier.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        +{currentTier.bonus} créditos extras por indicação validada
                    </p>
                </div>

                {/* Progresso */}
                {nextTier && (
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progresso para {nextTier.name}</span>
                            <span className="font-semibold text-gray-900">
                                {totalValid} / {nextTier.min} indicações
                            </span>
                        </div>
                        <Progress value={progressInCurrentTier} className="h-3" />
                        <p className="text-xs text-gray-500 mt-2">
                            Faltam {nextTier.min - totalValid} indicações para o próximo nível
                        </p>
                    </div>
                )}

                {/* Todos os Tiers */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Todos os Níveis</h4>
                    {TIERS.map((tier, index) => {
                        const TierIcon = tier.icon;
                        const isUnlocked = totalValid >= tier.min;
                        const isCurrent = tier === currentTier;
                        
                        return (
                            <div
                                key={tier.name}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                    isCurrent 
                                        ? 'bg-violet-50 border-violet-300 shadow-sm' 
                                        : isUnlocked 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-gray-50 border-gray-200 opacity-60'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center ${!isUnlocked && 'opacity-40'}`}>
                                    <TierIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-semibold text-gray-900">{tier.name}</h5>
                                        {isCurrent && (
                                            <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">
                                                Atual
                                            </span>
                                        )}
                                        {isUnlocked && !isCurrent && (
                                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        {tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`} indicações • +{tier.bonus} créditos extras
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}