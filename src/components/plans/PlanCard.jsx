import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlanCard({ plan, currentPlanId, onUpgrade, isLoading, index }) {
    const isCurrent = plan.id === currentPlanId;
    const isFree = plan.price === 0;

    const icons = {
        0: Zap,
        1: Sparkles,
        2: Crown,
        3: Crown
    };

    const Icon = icons[index] || Zap;

    const gradients = [
        'from-blue-500 to-cyan-600',
        'from-violet-500 to-purple-600',
        'from-amber-500 to-orange-600',
        'from-pink-500 to-rose-600'
    ];

    const gradient = gradients[index] || gradients[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className={`relative h-full ${isCurrent ? 'border-2 border-violet-500 shadow-xl' : ''}`}>
                {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-violet-500 hover:bg-violet-600">
                            Plano Atual
                        </Badge>
                    </div>
                )}

                <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    
                    <div className="pt-2">
                        <div className="flex items-baseline">
                            <span className="text-4xl font-bold">${plan.price}</span>
                            {!isFree && <span className="text-gray-500 ml-2">/mês</span>}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-semibold">{plan.daily_limit} compilações/dia</span>
                        </div>
                        
                        {plan.features?.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {isCurrent ? (
                        <Button 
                            className="w-full" 
                            variant="outline"
                            disabled
                        >
                            Plano Atual
                        </Button>
                    ) : isFree ? (
                        <Button 
                            className="w-full" 
                            variant="outline"
                            disabled
                        >
                            Plano Gratuito
                        </Button>
                    ) : (
                        <Button
                            onClick={() => onUpgrade(plan)}
                            disabled={isLoading}
                            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white`}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Assinar Agora
                        </Button>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}