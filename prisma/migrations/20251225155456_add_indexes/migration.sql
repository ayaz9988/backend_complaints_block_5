-- CreateIndex
CREATE INDEX "Achievement_status_idx" ON "Achievement"("status");

-- CreateIndex
CREATE INDEX "Achievement_createdAt_idx" ON "Achievement"("createdAt");

-- CreateIndex
CREATE INDEX "Achievement_updatedAt_idx" ON "Achievement"("updatedAt");

-- CreateIndex
CREATE INDEX "Achievement_createdBy_idx" ON "Achievement"("createdBy");

-- CreateIndex
CREATE INDEX "Achievement_status_createdAt_idx" ON "Achievement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Achievement_status_updatedAt_idx" ON "Achievement"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "Announcement"("status");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_updatedAt_idx" ON "Announcement"("updatedAt");

-- CreateIndex
CREATE INDEX "Announcement_createdBy_idx" ON "Announcement"("createdBy");

-- CreateIndex
CREATE INDEX "Announcement_status_createdAt_idx" ON "Announcement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_status_updatedAt_idx" ON "Announcement"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Initiative_status_idx" ON "Initiative"("status");

-- CreateIndex
CREATE INDEX "Initiative_neighborhood_idx" ON "Initiative"("neighborhood");

-- CreateIndex
CREATE INDEX "Initiative_location_idx" ON "Initiative"("location");

-- CreateIndex
CREATE INDEX "Initiative_createdAt_idx" ON "Initiative"("createdAt");

-- CreateIndex
CREATE INDEX "Initiative_updatedAt_idx" ON "Initiative"("updatedAt");

-- CreateIndex
CREATE INDEX "Initiative_status_createdAt_idx" ON "Initiative"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Initiative_status_neighborhood_idx" ON "Initiative"("status", "neighborhood");

-- CreateIndex
CREATE INDEX "Initiative_neighborhood_status_idx" ON "Initiative"("neighborhood", "status");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_revoked_expiresAt_idx" ON "RefreshToken"("revoked", "expiresAt");

-- CreateIndex
CREATE INDEX "User_role_is_active_idx" ON "User"("role", "is_active");

-- CreateIndex
CREATE INDEX "User_neighborhood_idx" ON "User"("neighborhood");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "complaints_complaint_status_idx" ON "complaints"("complaint_status");

-- CreateIndex
CREATE INDEX "complaints_priority_idx" ON "complaints"("priority");

-- CreateIndex
CREATE INDEX "complaints_neighborhood_idx" ON "complaints"("neighborhood");

-- CreateIndex
CREATE INDEX "complaints_complaint_type_idx" ON "complaints"("complaint_type");

-- CreateIndex
CREATE INDEX "complaints_mukhtarInitialId_idx" ON "complaints"("mukhtarInitialId");

-- CreateIndex
CREATE INDEX "complaints_working_on_by_idx" ON "complaints"("working_on_by");

-- CreateIndex
CREATE INDEX "complaints_is_working_on_idx" ON "complaints"("is_working_on");

-- CreateIndex
CREATE INDEX "complaints_createdAt_idx" ON "complaints"("createdAt");

-- CreateIndex
CREATE INDEX "complaints_updatedAt_idx" ON "complaints"("updatedAt");

-- CreateIndex
CREATE INDEX "complaints_deletedAt_idx" ON "complaints"("deletedAt");

-- CreateIndex
CREATE INDEX "complaints_complaint_status_priority_idx" ON "complaints"("complaint_status", "priority");

-- CreateIndex
CREATE INDEX "complaints_complaint_status_neighborhood_idx" ON "complaints"("complaint_status", "neighborhood");

-- CreateIndex
CREATE INDEX "complaints_complaint_status_mukhtarInitialId_idx" ON "complaints"("complaint_status", "mukhtarInitialId");

-- CreateIndex
CREATE INDEX "complaints_priority_complaint_status_idx" ON "complaints"("priority", "complaint_status");

-- CreateIndex
CREATE INDEX "complaints_neighborhood_complaint_status_idx" ON "complaints"("neighborhood", "complaint_status");

-- CreateIndex
CREATE INDEX "complaints_createdAt_complaint_status_idx" ON "complaints"("createdAt", "complaint_status");

-- CreateIndex
CREATE INDEX "complaints_updatedAt_complaint_status_idx" ON "complaints"("updatedAt", "complaint_status");

-- RenameIndex
ALTER INDEX "complaints_trackingTag_key" RENAME TO "complaints_tracking_tag_unique";
