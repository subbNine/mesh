"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasElementType = exports.NotificationType = exports.ProjectMemberRole = exports.WorkspaceMemberRole = exports.TaskStatus = void 0;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["Todo"] = "todo";
    TaskStatus["InProgress"] = "inprogress";
    TaskStatus["Review"] = "review";
    TaskStatus["Done"] = "done";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var WorkspaceMemberRole;
(function (WorkspaceMemberRole) {
    WorkspaceMemberRole["Owner"] = "owner";
    WorkspaceMemberRole["Member"] = "member";
})(WorkspaceMemberRole || (exports.WorkspaceMemberRole = WorkspaceMemberRole = {}));
var ProjectMemberRole;
(function (ProjectMemberRole) {
    ProjectMemberRole["Admin"] = "admin";
    ProjectMemberRole["Member"] = "member";
})(ProjectMemberRole || (exports.ProjectMemberRole = ProjectMemberRole = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["Assigned"] = "assigned";
    NotificationType["Mentioned"] = "mentioned";
    NotificationType["Commented"] = "commented";
    NotificationType["AddedToProject"] = "added_to_project";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var CanvasElementType;
(function (CanvasElementType) {
    CanvasElementType["Text"] = "text";
    CanvasElementType["Image"] = "image";
})(CanvasElementType || (exports.CanvasElementType = CanvasElementType = {}));
//# sourceMappingURL=enums.js.map