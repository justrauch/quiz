interface Quiz { 
    id: number; 
    name: string; 
    is_public: boolean; 
    creater: number; 
} 

interface EditQuizProps { 
    editelement: Quiz | undefined; 
} 

export function StartQuiz({ editelement }: EditQuizProps) { 
    return ( 
        <div> 
            <p>
                {editelement?.name}
            </p> 
            <button>{editelement?.id}</button>
        </div> 
    ); 
}