define('deathangel',
    ['underscore'],
    function(_) {
        
        var VanillaMarine = {
            shots : 1,
            
            get_states_attack : function(state) {
                var states = [];
                var s;
                if (state.front > 0) {
                    s =  state.next(Chance('shot_hit', 0.5),
                    {
                        front : state.front - 1, 
                        remaining_shots : state.remaining_shots - 1
                    });
                    states.push(s);
                    
                    s = state.next(Chance('shot_miss', 0.5), 
                    {
                        remaining_shots : state.remaining_shots - 1
                    });
                    states.push(s);
                    if (state.support > 0) {
                        states.push(s.next(Choice('use_support_attack'), 
                        {
                            remaining_shots : state.remaining_shots,
                            support : state.support - 1
                        }));
                    }
                }
                
                return states;
            },
            
            get_states_defend_front : function(state) {
                var states = [];
                var s;
                var fail_p = Math.min(1.0, (state.front+1) / 6.0);
                
                if (state.front == 0) {
                    s = state.next(Chance('front_defense_success', 1.0),
                    {
                        attacked_front : true
                    });
                    states.push(s);
                } else if (state.front >= 5) {
                    s = state.next(Chance('front_defense_fails', 1.0),
                    {
                        marine_dead : true, 
                        attacked_front : true
                    });
                    states.push(s);
                } else {
                    s = state.next(Chance('front_defense_success', 1-fail_p), {
                        attacked_front : true
                    });
                    states.push(s);
                    
                    s = state.next(Chance('front_defense_fails', fail_p), 
                    {
                        marine_dead : true, 
                        attacked_front : true
                    });
                    
                    states.push(s);
                    if (state.support > 0) {
                        states.push(s.next(Choice('use_support_defense'),
                        {
                            marine_dead : false,
                            attacked_front : false,
                            support : state.support - 1
                        }));
                    }
                }
                
                return states;
            },
            
            get_states_defend_behind : function(state) {
                var states = [];
                var s;
                var fail_p = Math.min(1.0, (state.behind+1) / 6.0);
                
                if (state.behind == 0) {
                    s = state.next(Chance('behind_defense_success', 1.0),
                    {
                        attacked_behind : true
                    });
                    states.push(s);
                } else if (state.behind >= 5) {
                    s = state.next(Chance('behind_defense_fails', 1.0),
                    {
                        marine_dead : true, 
                        attacked_behind : true
                    });
                    states.push(s);
                } else {
                    s = state.next(Chance('behind_defense_success', 1-fail_p), {
                        attacked_behind : true
                    });
                    states.push(s);
                    
                    s = state.next(Chance('behind_defense_fails', fail_p), 
                    {
                        marine_dead : true, 
                        attacked_behind : true
                    });
                    
                    states.push(s);
                }
                
                return states;
            }
        }
        
        var Leon = _.extend({}, VanillaMarine, {
            shots : 3
        });
        
        function Chance(description, probability) {
            if (!(this instanceof Chance)) {
                return new Chance(description, probability);
            }
            this.type = 'chance';
            this.description = description;
            this.probability = probability;
            return this;
        }
        
        function Choice(description) {
            if (!(this instanceof Choice)) {
                return new Choice(description);
            }
            this.type = 'choice';
            this.description = description;
            this.probability = 1.0;
            return this;
        }
        
        /**
         * This represents a state of the game.
         */
        function State(marine, supportTokens, frontGss, behindGss) {
            if (!(this instanceof State)) {
                return new State(marine, supportTokens, frontGss, behindGss);
            }
            
            this.marine = marine;
            this.remaining_shots = marine.shots;
            this.support = supportTokens;
            this.front = frontGss;
            this.behind = behindGss;
            
            this.path = [];
            this.marine_dead = false;
            this.attacked_front = false;
            this.attacked_behind = false;
            
            return this;
        }
        _.extend(State.prototype, {
            next : function(ev, changes) {
                return _.extend({},
                    this, 
                    changes,
                    {
                        path : this.path.concat(ev)
                    }
                    );
            }
        });
        
        /**
         * This dispatches the correct function for the turn phase.
         */
        function next_states_for_turn(state) {
            if (state.marine_dead) {
                return [];
            } else if (state.remaining_shots > 0) {
                return state.marine.get_states_attack(state);
            } else if (!state.attacked_front) {
                return state.marine.get_states_defend_front(state);
            } else if (!state.attacked_behind) {
                return state.marine.get_states_defend_behind(state);
            } else {
                return [];
            }
        }
        
        /**
         * This collects the states to make a report.
         */
        function Digester() {
            if (!(this instanceof Digester)) {
                return new Digester();
            }
            this.data = {};
            
            this.digest = function(state) {
                var p = 1.0;
                var choices = [];
                _.each(state.path, function(x) {
                    p *= x.probability;
                    if (x.type == 'choice') {
                        choices.push(x.description);
                    }
                });
        }
        return this;
    }
        
    return {
        next_states_for_turn : next_states_for_turn,
        Digester : Digester,
        marines : {
            Valencio : VanillaMarine,
            Leon : Leon
        },
        State : State
    };
})