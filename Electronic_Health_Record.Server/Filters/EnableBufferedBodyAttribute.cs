using Microsoft.AspNetCore.Mvc.Filters;

namespace Electronic_Health_Record.Server.Filters
{
    /// <summary>
    /// Makes the request body re-readable for the action it is applied to.
    ///
    /// By default the body is a forward-only stream that model binding consumes
    /// once, so an action that needs the raw JSON as well as the bound DTO gets
    /// an empty stream on the second read. This buffers it instead.
    ///
    /// It is a resource filter rather than an action filter on purpose: resource
    /// filters run before model binding, and buffering has to be switched on
    /// while the body is still unread.
    ///
    /// Applied per action rather than as global middleware because buffering
    /// costs memory on every request that carries a body -- only the sparse
    /// PATCH on WellnessFormsController actually needs it, and a large signature
    /// data URL posted to a station endpoint should not be held in memory twice
    /// for no reason.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public sealed class EnableBufferedBodyAttribute : Attribute, IResourceFilter
    {
        public void OnResourceExecuting(ResourceExecutingContext context)
        {
            context.HttpContext.Request.EnableBuffering();
        }

        public void OnResourceExecuted(ResourceExecutedContext context)
        {
            // nothing to undo: the buffered stream is disposed with the request
        }
    }
}
