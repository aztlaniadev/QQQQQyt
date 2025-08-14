# Answers Routes
@api_router.post("/answers/{answer_id}/vote")
async def vote_answer(answer_id: str, vote_data: dict, current_user: dict = Depends(get_current_user)):
    vote_type = vote_data.get("vote_type")  # "up" or "down"
    
    # Check if answer exists
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    
    # Check existing vote
    existing_vote = await db.votes.find_one({
        "user_id": current_user["id"],
        "target_id": answer_id,
        "target_type": "answer"
    })
    
    if existing_vote:
        # Update existing vote
        old_type = existing_vote["vote_type"]
        if old_type != vote_type:
            await db.votes.update_one(
                {"id": existing_vote["id"]},
                {"$set": {"vote_type": vote_type}}
            )
            
            # Update answer counters
            if old_type == "up":
                await db.answers.update_one({"id": answer_id}, {"$inc": {"upvotes": -1}})
            else:
                await db.answers.update_one({"id": answer_id}, {"$inc": {"downvotes": -1}})
                
            if vote_type == "up":
                await db.answers.update_one({"id": answer_id}, {"$inc": {"upvotes": 1}})
            else:
                await db.answers.update_one({"id": answer_id}, {"$inc": {"downvotes": 1}})
        
        return {"message": "Voto atualizado"}
    else:
        # Create new vote
        vote = Vote(
            user_id=current_user["id"],
            target_id=answer_id,
            target_type="answer",
            vote_type=vote_type
        )
        
        await db.votes.insert_one(vote.dict())
        
        # Update answer counters
        if vote_type == "up":
            await db.answers.update_one({"id": answer_id}, {"$inc": {"upvotes": 1}})
        else:
            await db.answers.update_one({"id": answer_id}, {"$inc": {"downvotes": 1}})
        
        return {"message": "Voto registrado"}

# Follow System
@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Você não pode seguir a si mesmo")
    
    # Check if target user exists
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Check if already following
    current_user_data = await db.users.find_one({"id": current_user["id"]})
    following_list = current_user_data.get("following", [])
    
    if user_id in following_list:
        # Unfollow
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$pull": {"following": user_id}}
        )
        await db.users.update_one(
            {"id": user_id},
            {"$pull": {"followers": current_user["id"]}}
        )
        return {"message": "Usuário removido dos seguidos"}
    else:
        # Follow
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$addToSet": {"following": user_id}}
        )
        await db.users.update_one(
            {"id": user_id},
            {"$addToSet": {"followers": current_user["id"]}}
        )
        return {"message": "Usuário seguido com sucesso"}