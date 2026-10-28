import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as AdsRouteImport } from './routes/ads'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as ClientLoginRouteImport } from './routes/client-login'
import { Route as ClientLogoutRouteImport } from './routes/client-logout'
import { Route as ClientPortalRouteImport } from './routes/client-portal'
import { Route as ClientSupportTicketsRouteImport } from './routes/client-support.tickets'
import { Route as ClientSupportTicketsIdRouteImport } from './routes/client-support.tickets.$id'
import { Route as ContactRouteImport } from './routes/contact'
import { Route as ForgotPasswordRouteImport } from './routes/forgot-password'
import { Route as MaintenanceRouteImport } from './routes/maintenance'
import { Route as MyRequestsRouteImport } from './routes/my-requests'
import { Route as ProjectsRouteImport } from './routes/projects'
import { Route as ProjectOwnerLoginRouteImport } from './routes/project-owner-login'
import { Route as ProjectOwnerRouteImport } from './routes/project-owner'
import { Route as ProjectOwnerNewRouteImport } from './routes/project-owner.new'
import { Route as ProjectOwnerTicketsRouteImport } from './routes/project-owner.tickets'
import { Route as ProjectOwnerTicketsIdRouteImport } from './routes/project-owner.tickets.$id'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'
import { Route as SubscribeSuccessRouteImport } from './routes/subscribe-success'
import { Route as ThankYouRouteImport } from './routes/thank-you'
import { Route as UnsubscribeRouteImport } from './routes/unsubscribe'
import { Route as VipRouteImport } from './routes/vip'
import { Route as AuthenticatedAdminRouteImport } from './routes/_authenticated/admin'
import { Route as AuthenticatedChatRouteImport } from './routes/_authenticated/chat'
import { Route as AuthenticatedDashboardRouteImport } from './routes/_authenticated/dashboard'
import { Route as AuthenticatedEmployeesRouteImport } from './routes/_authenticated/employees'
import { Route as AuthenticatedUploadRouteImport } from './routes/_authenticated/upload'
import { Route as AdsAdIdRouteImport } from './routes/ads.$adId'
import { Route as EmailUnsubscribeRouteImport } from './routes/email/unsubscribe'
import { Route as ProjectIdRouteImport } from './routes/project.$id'
import { Route as VipIndexRouteImport } from './routes/vip.index'
import { Route as AuthenticatedAdminIndexRouteImport } from './routes/_authenticated/admin.index'
import { Route as AuthenticatedAdminAdsRouteImport } from './routes/_authenticated/admin.ads'
import { Route as AuthenticatedAdminBotSettingsRouteImport } from './routes/_authenticated/admin.bot-settings'
import { Route as AuthenticatedAdminBotTestRouteImport } from './routes/_authenticated/admin.bot-test'
import { Route as AuthenticatedAdminBotTrainingRouteImport } from './routes/_authenticated/admin.bot-training'
import { Route as AuthenticatedAdminChatRouteImport } from './routes/_authenticated/admin.chat'
import { Route as AuthenticatedAdminClientsRouteImport } from './routes/_authenticated/admin.clients'
import { Route as AuthenticatedAdminEmployeesRouteImport } from './routes/_authenticated/admin.employees'
import { Route as AuthenticatedAdminExclusivityRouteImport } from './routes/_authenticated/admin.exclusivity'
import { Route as AuthenticatedAdminGroqSettingsRouteImport } from './routes/_authenticated/admin.groq-settings'
import { Route as AuthenticatedAdminMessagesRouteImport } from './routes/_authenticated/admin.messages'
import { Route as AuthenticatedAdminMyProjectsRouteImport } from './routes/_authenticated/admin.my-projects'
import { Route as AuthenticatedAdminOffersRouteImport } from './routes/_authenticated/admin.offers'
import { Route as AuthenticatedAdminPendingProjectsRouteImport } from './routes/_authenticated/admin.pending-projects'
import { Route as AuthenticatedAdminProjectsRouteImport } from './routes/_authenticated/admin.projects'
import { Route as AuthenticatedAdminRequestsRouteImport } from './routes/_authenticated/admin.requests'
import { Route as AuthenticatedAdminSettingsRouteImport } from './routes/_authenticated/admin.settings'
import { Route as AuthenticatedAdminSupportRouteImport } from './routes/_authenticated/admin.support'
import { Route as AuthenticatedAdminUsersRouteImport } from './routes/_authenticated/admin.users'
import { Route as AuthenticatedAdminProjectOwnersRouteImport } from './routes/_authenticated/admin.project-owners'
import { Route as AuthenticatedAdminVipRouteImport } from './routes/_authenticated/admin.vip'
import { Route as AuthenticatedAdminApprovalsRouteImport } from './routes/_authenticated/admin.approvals'
import { Route as ApiAdminR2RouteImport } from './routes/api/admin/r2'
import { Route as ApiCronCheckSubscriptionsRouteImport } from './routes/api/cron/check-subscriptions'
import { Route as ApiCronVipExpiryRouteImport } from './routes/api/cron/vip-expiry'
import { Route as ApiNotificationsSendRouteImport } from './routes/api/notifications/send'
import { Route as ApiNotificationsSubscribeRouteImport } from './routes/api/notifications/subscribe'
import { Route as ApiPublicUploadRouteImport } from './routes/api/public/upload'
import { Route as ApiPushSendRouteImport } from './routes/api/push/send'
import { Route as LovableEmailSuppressionRouteImport } from './routes/lovable/email/suppression'
import { Route as LovableEmailQueueProcessRouteImport } from './routes/lovable/email/queue/process'
import { Route as LovableEmailTransactionalPreviewRouteImport } from './routes/lovable/email/transactional/preview'
import { Route as LovableEmailTransactionalSendRouteImport } from './routes/lovable/email/transactional/send'
const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({ id: '/_authenticated', getParentRoute: () => rootRouteImport } as any)
const AdsRoute = AdsRouteImport.update({ id: '/ads', path: '/ads', getParentRoute: () => rootRouteImport } as any)
const AuthRoute = AuthRouteImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRouteImport } as any)
const ClientLoginRoute = ClientLoginRouteImport.update({ id: '/client-login', path: '/client-login', getParentRoute: () => rootRouteImport } as any)
const ClientLogoutRoute = ClientLogoutRouteImport.update({ id: '/client-logout', path: '/client-logout', getParentRoute: () => rootRouteImport } as any)
const ClientPortalRoute = ClientPortalRouteImport.update({ id: '/client-portal', path: '/client-portal', getParentRoute: () => rootRouteImport } as any)
const ClientSupportTicketsRoute = ClientSupportTicketsRouteImport.update({ id: '/client-support/tickets', path: '/client-support/tickets', getParentRoute: () => rootRouteImport } as any)
const ClientSupportTicketsIdRoute = ClientSupportTicketsIdRouteImport.update({ id: '/$id', path: '/$id', getParentRoute: () => ClientSupportTicketsRoute } as any)
const ContactRoute = ContactRouteImport.update({ id: '/contact', path: '/contact', getParentRoute: () => rootRouteImport } as any)
const ForgotPasswordRoute = ForgotPasswordRouteImport.update({ id: '/forgot-password', path: '/forgot-password', getParentRoute: () => rootRouteImport } as any)
const MaintenanceRoute = MaintenanceRouteImport.update({ id: '/maintenance', path: '/maintenance', getParentRoute: () => rootRouteImport } as any)
const MyRequestsRoute = MyRequestsRouteImport.update({ id: '/my-requests', path: '/my-requests', getParentRoute: () => rootRouteImport } as any)
const ProjectsRoute = ProjectsRouteImport.update({ id: '/projects', path: '/projects', getParentRoute: () => rootRouteImport } as any)
const ProjectOwnerLoginRoute = ProjectOwnerLoginRouteImport.update({ id: '/project-owner-login', path: '/project-owner-login', getParentRoute: () => rootRouteImport } as any)
const ProjectOwnerRoute = ProjectOwnerRouteImport.update({ id: '/project-owner', path: '/project-owner', getParentRoute: () => rootRouteImport } as any)
const ProjectOwnerNewRoute = ProjectOwnerNewRouteImport.update({ id: '/new', path: '/new', getParentRoute: () => ProjectOwnerRoute } as any)
const ProjectOwnerTicketsRoute = ProjectOwnerTicketsRouteImport.update({ id: '/tickets', path: '/tickets', getParentRoute: () => ProjectOwnerRoute } as any)
const ProjectOwnerTicketsIdRoute = ProjectOwnerTicketsIdRouteImport.update({ id: '/$id', path: '/$id', getParentRoute: () => ProjectOwnerTicketsRoute } as any)
const ResetPasswordRoute = ResetPasswordRouteImport.update({ id: '/reset-password', path: '/reset-password', getParentRoute: () => rootRouteImport } as any)
const SubscribeSuccessRoute = SubscribeSuccessRouteImport.update({ id: '/subscribe-success', path: '/subscribe-success', getParentRoute: () => rootRouteImport } as any)
const ThankYouRoute = ThankYouRouteImport.update({ id: '/thank-you', path: '/thank-you', getParentRoute: () => rootRouteImport } as any)
const UnsubscribeRoute = UnsubscribeRouteImport.update({ id: '/unsubscribe', path: '/unsubscribe', getParentRoute: () => rootRouteImport } as any)
const VipRoute = VipRouteImport.update({ id: '/vip', path: '/vip', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedAdminRoute = AuthenticatedAdminRouteImport.update({ id: '/admin', path: '/admin', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedChatRoute = AuthenticatedChatRouteImport.update({ id: '/chat', path: '/chat', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedDashboardRoute = AuthenticatedDashboardRouteImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedEmployeesRoute = AuthenticatedEmployeesRouteImport.update({ id: '/employees', path: '/employees', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedUploadRoute = AuthenticatedUploadRouteImport.update({ id: '/upload', path: '/upload', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AdsAdIdRoute = AdsAdIdRouteImport.update({ id: '/$adId', path: '/$adId', getParentRoute: () => AdsRoute } as any)
const EmailUnsubscribeRoute = EmailUnsubscribeRouteImport.update({ id: '/email/unsubscribe', path: '/email/unsubscribe', getParentRoute: () => rootRouteImport } as any)
const ProjectIdRoute = ProjectIdRouteImport.update({ id: '/project/$id', path: '/project/$id', getParentRoute: () => rootRouteImport } as any)
const VipIndexRoute = VipIndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => VipRoute } as any)
const AuthenticatedAdminIndexRoute = AuthenticatedAdminIndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminAdsRoute = AuthenticatedAdminAdsRouteImport.update({ id: '/ads', path: '/ads', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminBotSettingsRoute = AuthenticatedAdminBotSettingsRouteImport.update({ id: '/bot-settings', path: '/bot-settings', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminBotTestRoute = AuthenticatedAdminBotTestRouteImport.update({ id: '/bot-test', path: '/bot-test', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminBotTrainingRoute = AuthenticatedAdminBotTrainingRouteImport.update({ id: '/bot-training', path: '/bot-training', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminChatRoute = AuthenticatedAdminChatRouteImport.update({ id: '/chat', path: '/chat', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminClientsRoute = AuthenticatedAdminClientsRouteImport.update({ id: '/clients', path: '/clients', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminEmployeesRoute = AuthenticatedAdminEmployeesRouteImport.update({ id: '/employees', path: '/employees', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminExclusivityRoute = AuthenticatedAdminExclusivityRouteImport.update({ id: '/exclusivity', path: '/exclusivity', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminGroqSettingsRoute = AuthenticatedAdminGroqSettingsRouteImport.update({ id: '/groq-settings', path: '/groq-settings', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminMessagesRoute = AuthenticatedAdminMessagesRouteImport.update({ id: '/messages', path: '/messages', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminMyProjectsRoute = AuthenticatedAdminMyProjectsRouteImport.update({ id: '/my-projects', path: '/my-projects', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminOffersRoute = AuthenticatedAdminOffersRouteImport.update({ id: '/offers', path: '/offers', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminPendingProjectsRoute = AuthenticatedAdminPendingProjectsRouteImport.update({ id: '/pending-projects', path: '/pending-projects', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminProjectsRoute = AuthenticatedAdminProjectsRouteImport.update({ id: '/projects', path: '/projects', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminRequestsRoute = AuthenticatedAdminRequestsRouteImport.update({ id: '/requests', path: '/requests', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminSettingsRoute = AuthenticatedAdminSettingsRouteImport.update({ id: '/settings', path: '/settings', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminSupportRoute = AuthenticatedAdminSupportRouteImport.update({ id: '/support', path: '/support', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminUsersRoute = AuthenticatedAdminUsersRouteImport.update({ id: '/users', path: '/users', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminProjectOwnersRoute = AuthenticatedAdminProjectOwnersRouteImport.update({ id: '/project-owners', path: '/project-owners', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminVipRoute = AuthenticatedAdminVipRouteImport.update({ id: '/vip', path: '/vip', getParentRoute: () => AuthenticatedAdminRoute } as any)
const AuthenticatedAdminApprovalsRoute = AuthenticatedAdminApprovalsRouteImport.update({ id: '/approvals', path: '/approvals', getParentRoute: () => AuthenticatedAdminRoute } as any)
const ApiAdminR2Route = ApiAdminR2RouteImport.update({ id: '/api/admin/r2', path: '/api/admin/r2', getParentRoute: () => rootRouteImport } as any)
const ApiCronCheckSubscriptionsRoute = ApiCronCheckSubscriptionsRouteImport.update({ id: '/api/cron/check-subscriptions', path: '/api/cron/check-subscriptions', getParentRoute: () => rootRouteImport } as any)
const ApiCronVipExpiryRoute = ApiCronVipExpiryRouteImport.update({ id: '/api/cron/vip-expiry', path: '/api/cron/vip-expiry', getParentRoute: () => rootRouteImport } as any)
const ApiNotificationsSendRoute = ApiNotificationsSendRouteImport.update({ id: '/api/notifications/send', path: '/api/notifications/send', getParentRoute: () => rootRouteImport } as any)
const ApiNotificationsSubscribeRoute = ApiNotificationsSubscribeRouteImport.update({ id: '/api/notifications/subscribe', path: '/api/notifications/subscribe', getParentRoute: () => rootRouteImport } as any)
const ApiPublicUploadRoute = ApiPublicUploadRouteImport.update({ id: '/api/public/upload', path: '/api/public/upload', getParentRoute: () => rootRouteImport } as any)
const ApiPushSendRoute = ApiPushSendRouteImport.update({ id: '/api/push/send', path: '/api/push/send', getParentRoute: () => rootRouteImport } as any)
const LovableEmailSuppressionRoute = LovableEmailSuppressionRouteImport.update({ id: '/lovable/email/suppression', path: '/lovable/email/suppression', getParentRoute: () => rootRouteImport } as any)
const LovableEmailQueueProcessRoute = LovableEmailQueueProcessRouteImport.update({ id: '/lovable/email/queue/process', path: '/lovable/email/queue/process', getParentRoute: () => rootRouteImport } as any)
const LovableEmailTransactionalPreviewRoute = LovableEmailTransactionalPreviewRouteImport.update({ id: '/lovable/email/transactional/preview', path: '/lovable/email/transactional/preview', getParentRoute: () => rootRouteImport } as any)
const LovableEmailTransactionalSendRoute = LovableEmailTransactionalSendRouteImport.update({ id: '/lovable/email/transactional/send', path: '/lovable/email/transactional/send', getParentRoute: () => rootRouteImport } as any)

const ClientSupportTicketsRouteChildren = { ClientSupportTicketsIdRoute }
const AdsRouteChildren = { AdsAdIdRoute }
const VipRouteChildren = { VipIndexRoute }
const ProjectOwnerTicketsRouteChildren = { ProjectOwnerTicketsIdRoute }
const ProjectOwnerRouteChildren = { ProjectOwnerNewRoute, ProjectOwnerTicketsRoute: ProjectOwnerTicketsRoute._addFileChildren(ProjectOwnerTicketsRouteChildren) }
const AuthenticatedAdminRouteChildren = { AuthenticatedAdminIndexRoute, AuthenticatedAdminAdsRoute, AuthenticatedAdminBotSettingsRoute, AuthenticatedAdminBotTestRoute, AuthenticatedAdminBotTrainingRoute, AuthenticatedAdminChatRoute, AuthenticatedAdminClientsRoute, AuthenticatedAdminEmployeesRoute, AuthenticatedAdminExclusivityRoute, AuthenticatedAdminGroqSettingsRoute, AuthenticatedAdminMessagesRoute, AuthenticatedAdminMyProjectsRoute, AuthenticatedAdminOffersRoute, AuthenticatedAdminPendingProjectsRoute, AuthenticatedAdminProjectsRoute, AuthenticatedAdminRequestsRoute, AuthenticatedAdminSettingsRoute, AuthenticatedAdminSupportRoute, AuthenticatedAdminUsersRoute, AuthenticatedAdminProjectOwnersRoute, AuthenticatedAdminVipRoute, AuthenticatedAdminApprovalsRoute }
const AuthenticatedRouteRouteChildren = { AuthenticatedAdminRoute: AuthenticatedAdminRoute._addFileChildren(AuthenticatedAdminRouteChildren), AuthenticatedChatRoute, AuthenticatedDashboardRoute, AuthenticatedEmployeesRoute, AuthenticatedUploadRoute }
const rootRouteChildren = { IndexRoute, AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren), AdsRoute: AdsRoute._addFileChildren(AdsRouteChildren), AuthRoute, ClientLoginRoute, ClientLogoutRoute, ClientPortalRoute, ClientSupportTicketsRoute: ClientSupportTicketsRoute._addFileChildren(ClientSupportTicketsRouteChildren), ContactRoute, ForgotPasswordRoute, MaintenanceRoute, MyRequestsRoute, ProjectsRoute, ProjectOwnerLoginRoute, ProjectOwnerRoute: ProjectOwnerRoute._addFileChildren(ProjectOwnerRouteChildren), ResetPasswordRoute, SubscribeSuccessRoute, ThankYouRoute, UnsubscribeRoute, VipRoute: VipRoute._addFileChildren(VipRouteChildren), AdsAdIdRoute, EmailUnsubscribeRoute, ProjectIdRoute, LovableEmailSuppressionRoute, LovableEmailQueueProcessRoute, LovableEmailTransactionalPreviewRoute, LovableEmailTransactionalSendRoute }
const rootRoute = rootRouteImport._addFileChildren(rootRouteChildren)
const routeTree = rootRoute
export { routeTree }
